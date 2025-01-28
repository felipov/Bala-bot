const Discord = require("discord.js");
const cor = require('../../config').discord.color
const { QuickDB } = require("quick.db");
const { join } = require("path");

const db = {
  staffs: new QuickDB({ table: "staffs", filePath: join(process.cwd(), "database/staffs.sqlite") }),
};

module.exports = {
  name: "staffs",
  description: "Lista os staffs registrados no sistema.",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {

    try {
      // Obtendo os staffs registrados no banco
      let staffs = await db.staffs.all();

      // Verifica se não há staffs registrados
      if (!staffs || staffs.length === 0) {
        return interaction.reply({
          content: "Nenhum staff foi registrado na database.",
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Mapeando nomes e IDs
      const staffList = staffs.map((staff, index) => {
        const { id, value } = staff;
        return `${index + 1}. **${value.name || "Sem Nome"} | ID Staff: ${id}**`;
      });

      // Cria a mensagem embed listando os staffs
      const embed = new Discord.EmbedBuilder()
        .setColor(cor)
        .setTitle(`Staffs registrados`)
        .setDescription(`> ${staffList.join("\n> ")}`)
        .setFooter({ text: "Clube do Bala", iconURL: "https://cdn.discordapp.com/emojis/1305569586355109929.png?size=2048" })

      // Responde a interação com a lista formatada
      await interaction.reply({
        embeds: [embed],
      });

    } catch (error) {
      console.error("Erro ao executar o comando de listar staffs:", error);
      return interaction.reply({
        content: "Ocorreu um erro ao executar o comando. Tente novamente mais tarde.",
        flags: Discord.MessageFlags.Ephemeral
      });
    }
  },
};
