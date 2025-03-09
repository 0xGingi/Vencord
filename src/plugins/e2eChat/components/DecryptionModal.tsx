import {
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalRoot,
    openModal,
} from "@utils/modal";
import { Button, Forms, React, Switch, TextInput } from "@webpack/common";

import { settings } from "../index";
import { decrypt } from "../encryption";

interface DecryptionModalProps {
    onClose: () => void;
    message: any;
    onDecrypt?: (password: string) => void;
}

export function DecryptionModal(props: DecryptionModalProps) {
    const encryptedMessage: string = props?.message?.content;
    const [password, setPassword] = React.useState(settings.store.defaultPassword || "");
    const [savePassword, setSavePassword] = React.useState(settings.store.savePasswordsPerChannel);
    const [isDecrypting, setIsDecrypting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleDecrypt = async () => {
        if (!password) return;

        try {
            setIsDecrypting(true);
            setError(null);

            const decrypted = await decrypt(encryptedMessage, password);
            if (!decrypted || !props?.message) {
                setError("Decryption failed. Please check your password and try again.");
                return;
            }

            // Build decrypted embed
            Vencord.Plugins.plugins.E2EChat.buildDecryptedEmbed(props?.message, decrypted);

            // Call the onDecrypt callback if provided
            if (props.onDecrypt) {
                props.onDecrypt(password);
            }

            props.onClose();
        } catch (error) {
            console.error("[E2EChat] Decryption failed:", error);
            setError("An error occurred during decryption.");
        } finally {
            setIsDecrypting(false);
        }
    };

    return (
        <ModalRoot {...props}>
            <ModalHeader>
                <Forms.FormTitle tag="h4">Decrypt Message</Forms.FormTitle>
            </ModalHeader>

            <ModalContent>
                <Forms.FormTitle tag="h5" style={{ marginTop: "10px" }}>Encrypted Message</Forms.FormTitle>
                <TextInput defaultValue={encryptedMessage} disabled={true} />

                <Forms.FormTitle tag="h5" style={{ marginTop: "10px" }}>Password</Forms.FormTitle>
                <TextInput
                    style={{ marginBottom: "10px" }}
                    value={password}
                    onChange={setPassword}
                    type="password"
                />

                {settings.store.savePasswordsPerChannel && (
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

                {error && (
                    <Forms.FormText style={{ color: "var(--text-danger)", marginTop: "10px" }}>
                        {error}
                    </Forms.FormText>
                )}
            </ModalContent>

            <ModalFooter>
                <Button
                    color={Button.Colors.GREEN}
                    disabled={!password || isDecrypting}
                    onClick={handleDecrypt}
                >
                    {isDecrypting ? "Decrypting..." : "Decrypt"}
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

export function buildDecryptModal(options: Partial<Omit<DecryptionModalProps, "onClose">> & { message: any; }) {
    return openModal(props => <DecryptionModal {...props} {...options} />);
} 