const Discord = require("discord.js");
const cor = require("../../config").discord.color;
const { PermissionsBitField } = require("discord.js");
const { addStaff } = require('../../Handler/staffHandler');
const { QuickDB } = require("quick.db");
const { join } = require("path");

const db = {
  staffs: new QuickDB({ table: "staffs", filePath: join(process.cwd(), "database/staffs.sqlite") }),
};

module.exports = {
  name: "dbaddstaff",
  description: "Adiciona um staff na database",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "staff_user",
      description: "Mencione o user do staff a ser salvo",
      type: Discord.ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "staff_name",
      description: "Escreva o nome do staff a ser salvo",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "staff_id",
      description: "Escreva o ID staff do staff a ser salvo",
      type: Discord.ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],

  run: async (client, interaction) => {
    try {
      // Verificar se o comando está sendo usado em um servidor
      if (!interaction.guild) {
        return interaction.reply({
          content: "Este comando só pode ser usado em um servidor.",
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Verificar permissões do membro
      const member = interaction.member;
      if (!member.permissions || !member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
          content: "Você não tem permissão para executar este comando.",
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Obter o nome e o ID fornecidos pelo usuário
      const staffUser = interaction.options.getUser("staff_user");
      const staffName = interaction.options.getString("staff_name");
      const staffId = interaction.options.getInteger("staff_id");

      // Validar o usuário do staff
      if (!staffUser) {
        return interaction.reply({
          content: "O user do staff não pode estar vazio.",
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Validar o usuário do staff
      if (!staffName) {
        return interaction.reply({
          content: "O nome do staff não pode estar vazio.",
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Validar o ID do staff
      if (isNaN(staffId) || staffId <= 0) {
        return interaction.reply({
          content: "O ID do staff deve ser um número válido e positivo.",
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Verificar se esse ID ja esta registrado
      const existingStaffById = await db.staffs.get(staffId.toString());
      if (existingStaffById) {
        return interaction.reply({
          content: `Já existe um staff registrado com esse ID Staff: **${existingStaffById.name}**.`,
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Verificar se o staff já está registrado pelo nome de usuário
      const existingStaffByUser = await db.staffs.all();
      const isUserAlreadyStaff = existingStaffByUser.some((staff) => staff.value.id === staffUser.id);
      if (isUserAlreadyStaff) {
        return interaction.reply({
          content: `O usuário **${staffUser}** já está registrado como staff.`,
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Adicionar o staff ao banco de dados
      await db.staffs.set(staffId.toString(), { name: staffName, id: staffUser.id });

      // Atualiza a lista de staffs
      await addStaff(interaction.client);

      // Confirmar o sucesso da operação
      return interaction.reply({
        embeds: [
          new Discord.EmbedBuilder()
            .setColor(cor)
            .setTitle("Novo staff adicionado")
            .setDescription(
              `> **Usuário:** ${staffUser} \n> **Nome:** ${staffName} \n> **ID Staff:** ${staffId}`
            )
            .setFooter({ text: "Clube do Bala", iconURL: "https://cdn.discordapp.com/emojis/1305569586355109929.png?size=2048" })
        ],
      });
    } catch (error) {
      console.error("Erro ao executar o comando de adicionar staff:", error);
      return interaction.reply({
        content: "Ocorreu um erro ao executar o comando. Tente novamente mais tarde.",
        flags: Discord.MessageFlags.Ephemeral,
      });
    }
  },
};
