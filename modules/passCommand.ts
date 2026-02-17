import { Colors, CommandExecInfo, Module, ModuleCommand, Room } from "haxball-extended-room";

@Module
export class PassCommand {

    constructor(private $: Room) {}

    @ModuleCommand({
        aliases: ["senha", "password", "pass"],
        deleteMessage: true
    })
    setPassword(command: CommandExecInfo) {
        if (!command.player.topRole?.admin) {
            command.player.reply({ message: `[🔒] Você não tem permissão para alterar a senha da sala!`, color: Colors.IndianRed });
            return;
        }

        const args = command.arguments;
        if (args.length === 0) {
            this.$.setPassword(null);
            this.$.send({ message: `[🔓] A senha da sala foi removida!`, color: Colors.LimeGreen });
        } else {
            const password = args.join(" ");
            this.$.setPassword(password);
            this.$.send({ message: `[🔒] A senha da sala foi definida!`, color: Colors.Orange });
        }
    }
}
