const Discord = require("discord.js");
const cor = require("../../config").discord.color;
const { PermissionsBitField } = require("discord.js");
const { QuickDB } = require("quick.db");
const { join } = require("path");

const db = {
  channels: new QuickDB({ table: "channels", filePath: join(process.cwd(), "database/channels.sqlite") }),
};

module.exports = {
  name: "avaliacao",
  description: "Enviar painel de avaliação",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "canal_avaliacao",
      description: "Canal para enviar avaliação",
      type: Discord.ApplicationCommandOptionType.Channel,
      required: true,
    },
    {
      name: "canal_logs",
      description: "Canal para enviar os logs",
      type: Discord.ApplicationCommandOptionType.Channel,
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

      const member = interaction.member;

      // Verificar permissões do membro
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
          content: "Você não tem permissão para executar este comando.",
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Obter os canais fornecidos pelo usuário
      const canal_avaliacao = interaction.options.getChannel("canal_avaliacao");
      const canal_logs = interaction.options.getChannel("canal_logs");

      // Validar se os canais são do tipo texto
      if (!canal_avaliacao || canal_avaliacao.type !== Discord.ChannelType.GuildText) {
        return interaction.reply({
          content: `O canal de avaliação (${canal_avaliacao}) não é válido ou não é um canal de texto.`,
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      if (!canal_logs || canal_logs.type !== Discord.ChannelType.GuildText) {
        return interaction.reply({
          content: `O canal de logs (${canal_logs}) não é válido ou não é um canal de texto.`,
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Salvar IDs dos canais no banco de dados
      await db.channels.set(`canal_avaliacao_${interaction.guild.id}`, canal_avaliacao.id);
      await db.channels.set(`canal_logs_${interaction.guild.id}`, canal_logs.id);

      // Resposta de configuração bem-sucedida
      const embed = new Discord.EmbedBuilder()
        .setColor(cor)
        .setTitle("Canais configurados com sucesso")
        .setDescription(`> **Canal de avaliação:** ${canal_avaliacao}\n> **Canal de logs:** ${canal_logs}`);

      await interaction.reply({ embeds: [embed], flags: Discord.MessageFlags.Ephemeral });

      // Enviar painel de avaliação
      const embed_avaliacao = new Discord.EmbedBuilder()
        .setColor(cor)
        .setAuthor({
          name: "Clube do Bala",
          iconURL: "https://cdn.discordapp.com/emojis/1305569586355109929.png?size=2048",
        })
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setTitle("Avaliação Staff")
        .setDescription("Avalie um staff do servidor clicando no botão abaixo.");

      const botao = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
          .setCustomId("avaliacao")
          .setEmoji("📃")
          .setLabel("Clique aqui")
          .setStyle(Discord.ButtonStyle.Primary)
      );

      await canal_avaliacao.send({ embeds: [embed_avaliacao], components: [botao] });
    } catch (error) {
      console.error("Erro ao executar o comando de avaliação:", error);
      return interaction.reply({
        content: "Ocorreu um erro ao executar o comando. Tente novamente mais tarde.",
        flags: Discord.MessageFlags.Ephemeral,
      });
    }
  },
};
