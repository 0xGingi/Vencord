import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { insertTextIntoChatInputBox } from "@utils/discord";
import { updateMessage } from "@api/MessageUpdater";
import { addMessagePreSendListener, removeMessagePreSendListener } from "@api/MessageEvents";
import { React, Button, FluxDispatcher, ChannelStore, UserStore } from "@webpack/common";
import { Message } from "discord-types/general";

import { buildEncryptModal } from "./components/EncryptionModal";
import { buildDecryptModal } from "./components/DecryptionModal";
import { encrypt, decrypt } from "./encryption";

const settings = definePluginSettings({
    defaultPassword: {
        type: OptionType.STRING,
        default: "",
        description: "Default encryption password to use"
    },
    autoDecrypt: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Automatically try to decrypt messages with your default password"
    },
    indicatorColor: {
        type: OptionType.STRING,
        default: "#45f5f5",
        description: "Color for the decrypted message indicator"
    },
    autoEncrypt: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Automatically encrypt all messages (using default password)"
    },
    savePasswordsPerChannel: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Remember encryption passwords per channel"
    }
});

// For storing per-channel passwords
const channelPasswords = new Map<string, string>();

export default definePlugin({
    name: "E2EChat",
    description: "End-to-end encrypted chat for Discord with proper encryption",
    authors: [Devs.You],
    dependencies: ["MessageEventsAPI", "MessageUpdaterAPI"],
    settings,

    E2E_REGEX: new RegExp(/\[E2E:([A-Za-z0-9+/=]+)\]/),

    async start() {
        addMessagePreSendListener(this.onMessageSend);

        // Auto-decrypt observer for new messages
        const messageObserver = (message: Message) => {
            if (!settings.store.autoDecrypt) return;

            if (this.E2E_REGEX.test(message.content)) {
                setTimeout(async () => {
                    try {
                        // Try to decrypt with the default or channel-specific password
                        const channelId = message.channel_id;
                        const password = settings.store.savePasswordsPerChannel && channelPasswords.has(channelId)
                            ? channelPasswords.get(channelId)!
                            : settings.store.defaultPassword;

                        if (!password) return;

                        const decrypted = await decrypt(message.content, password);
                        if (decrypted) {
                            this.buildDecryptedEmbed(message, decrypted);
                        }
                    } catch (error) {
                        console.error("[E2EChat] Auto-decrypt failed:", error);
                    }
                }, 100);
            }
        };

        // Subscribe to message create events
        FluxDispatcher.subscribe("MESSAGE_CREATE", (data: any) => {
            if (data.message) messageObserver(data.message);
        });
    },

    stop() {
        removeMessagePreSendListener(this.onMessageSend);
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", this.messageObserver);
    },

    // Handler for message sending - for auto-encryption
    onMessageSend: async (channelId: string, msg: { content: string; }) => {
        if (!settings.store.autoEncrypt || !settings.store.defaultPassword || !msg.content || msg.content.startsWith("[E2E:")) {
            return false;
        }

        try {
            const password = settings.store.savePasswordsPerChannel && channelPasswords.has(channelId)
                ? channelPasswords.get(channelId)!
                : settings.store.defaultPassword;

            if (!password) return false;

            msg.content = await encrypt(msg.content, password);
            return false; // Allow the message to be sent
        } catch (error) {
            console.error("[E2EChat] Auto-encrypt failed:", error);
            return false;
        }
    },

    // Add a button to decrypt encrypted messages
    renderMessagePopoverButton(message) {
        return this.E2E_REGEX.test(message?.content)
            ? {
                label: "Decrypt Message",
                icon: this.encryptIcon,
                message: message,
                channel: ChannelStore.getChannel(message.channel_id),
                onClick: async () => {
                    try {
                        // Try auto-decrypt first if enabled
                        if (settings.store.autoDecrypt) {
                            const channelId = message.channel_id;
                            const password = settings.store.savePasswordsPerChannel && channelPasswords.has(channelId)
                                ? channelPasswords.get(channelId)!
                                : settings.store.defaultPassword;

                            if (password) {
                                const decrypted = await decrypt(message.content, password);
                                if (decrypted) {
                                    this.buildDecryptedEmbed(message, decrypted);
                                    return;
                                }
                            }
                        }

                        // If auto-decrypt failed or is disabled, show the decrypt modal
                        buildDecryptModal({
                            message,
                            onDecrypt: (password: string) => {
                                // Save channel password if enabled
                                if (settings.store.savePasswordsPerChannel && password) {
                                    channelPasswords.set(message.channel_id, password);
                                }
                            }
                        });
                    } catch (error) {
                        console.error("[E2EChat] Decrypt failed:", error);
                    }
                }
            }
            : null;
    },

    // Add a button to the chat bar to encrypt a message
    renderChatBarButton() {
        const channelId = ChannelStore.getChannelId();
        const hasChannelPassword = channelId && settings.store.savePasswordsPerChannel && channelPasswords.has(channelId);

        return (
            <Button
                onClick={() => {
                    buildEncryptModal({
                        channelId,
                        defaultPassword: hasChannelPassword
                            ? channelPasswords.get(channelId)!
                            : settings.store.defaultPassword,
                        onEncrypt: (password: string) => {
                            // Save channel password if enabled
                            if (settings.store.savePasswordsPerChannel && password) {
                                channelPasswords.set(channelId, password);
                            }
                        }
                    });
                }}
                tooltip="Send Encrypted Message"
            >
                {this.encryptIcon}
            </Button>
        );
    },

    // Create a decrypted embed for a message
    buildDecryptedEmbed(message: any, decrypted: string) {
        // Skip if this message already has our embed
        if (message.embeds?.some(e => e.title === "Decrypted Message" && e.footer?.text === "End-to-End Encrypted Message")) {
            return;
        }

        // Initialize embeds array if it doesn't exist
        if (!message.embeds) message.embeds = [];

        message.embeds.push({
            type: "rich",
            title: "Decrypted Message",
            color: parseInt(settings.store.indicatorColor.replace("#", ""), 16),
            description: decrypted,
            footer: {
                text: "End-to-End Encrypted Message",
            },
        });

        updateMessage(message.channel_id, message.id, { embeds: message.embeds });
    },

    // Lock icon for the plugin
    encryptIcon() {
        return (
            <svg
                fill="currentColor"
                width={24}
                height={24}
                viewBox="0 0 24 24"
            >
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
            </svg>
        );
    }
}); 