import { insertTextIntoChatInputBox } from "@utils/discord";
import {
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalRoot,
    openModal,
} from "@utils/modal";
import { Button, Forms, React, Switch, TextInput, Tooltip } from "@webpack/common";

import { settings } from "../settings";
import { encrypt } from "../encryption";

interface EncryptionModalProps {
    onClose: () => void;
    channelId?: string;
    defaultPassword?: string;
    onEncrypt?: (password: string) => void;
}

export function EncryptionModal(props: EncryptionModalProps) {
    const [message, setMessage] = React.useState("");
    const [password, setPassword] = React.useState(props.defaultPassword || settings.store.defaultPassword || "");
    const [savePassword, setSavePassword] = React.useState(settings.store.savePasswordsPerChannel);
    const [isEncrypting, setIsEncrypting] = React.useState(false);
    const isValid = message.length > 0 && password.length > 0;

    const handleEncrypt = async () => {
        if (!isValid) return;

        try {
            setIsEncrypting(true);

            // Encrypt the message
            const encrypted = await encrypt(message, password);

            // Insert the encrypted message into the chat input
            insertTextIntoChatInputBox(encrypted);

            // Call the onEncrypt callback if provided
            if (props.onEncrypt) {
                props.onEncrypt(password);
            }

            props.onClose();
        } catch (error) {
            console.error("[E2EChat] Encryption failed:", error);
        } finally {
            setIsEncrypting(false);
        }
    };

    return (
        <ModalRoot {...props}>
            <ModalHeader>
                <Forms.FormTitle tag="h4">Encrypt Message</Forms.FormTitle>
            </ModalHeader>

            <ModalContent>
                <Forms.FormTitle>Message</Forms.FormTitle>
                <TextInput
                    placeholder="Enter the message you want to encrypt"
                    onChange={setMessage}
                    value={message}
                    autoFocus
                />

                <Forms.FormTitle style={{ marginTop: "10px" }}>Password</Forms.FormTitle>
                <TextInput
                    placeholder="Enter encryption password"
                    value={password}
                    onChange={setPassword}
                    type="password"
                />

                {settings.store.savePasswordsPerChannel && props.channelId && (
                    <div style={{ marginTop: "10px", display: "flex", alignItems: "center" }}>
                        <Switch
                            checked={savePassword}
                            onChange={setSavePassword}
                        />
                        <Forms.FormText style={{ marginLeft: "8px" }}>
                            Remember this password for this channel
                        </Forms.FormText>
                    </div>
                )}
            </ModalContent>

            <ModalFooter>
                <Button
                    color={Button.Colors.GREEN}
                    disabled={!isValid || isEncrypting}
                    onClick={handleEncrypt}
                >
                    {isEncrypting ? "Encrypting..." : "Send"}
                </Button>
                <Button
                    color={Button.Colors.TRANSPARENT}
                    look={Button.Looks.LINK}
                    style={{ left: 15, position: "absolute" }}
                    onClick={props.onClose}
                >
                    Cancel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}

export function buildEncryptModal(options: Partial<Omit<EncryptionModalProps, "onClose">> = {}) {
    return openModal(props => <EncryptionModal {...props} {...options} />);
} 