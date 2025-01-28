const Discord = require('discord.js');
const cor = require('./config').discord.color

const client = new Discord.Client({
  intents: [
    Discord.IntentsBitField.Flags.DirectMessages,
    Discord.IntentsBitField.Flags.GuildInvites,
    Discord.IntentsBitField.Flags.GuildMembers,
    Discord.IntentsBitField.Flags.GuildPresences,
    Discord.IntentsBitField.Flags.Guilds,
    Discord.IntentsBitField.Flags.MessageContent,
    Discord.IntentsBitField.Flags.GuildMessageReactions,
    Discord.IntentsBitField.Flags.GuildEmojisAndStickers,
    Discord.IntentsBitField.Flags.GuildVoiceStates,
    Discord.IntentsBitField.Flags.GuildMessages
  ],
  partials: [
    Discord.Partials.User,
    Discord.Partials.Message,
    Discord.Partials.Reaction,
    Discord.Partials.Channel,
    Discord.Partials.GuildMember
  ]
});

require('./Handler/commands')(client);
require('./Handler/events')(client);

client.on('interactionCreate', (interaction) => {
  if (interaction.type === Discord.InteractionType.ApplicationCommand) {
    const command = client.slashCommands.get(interaction.commandName);

    if (!command) {
      interaction.reply({ flags: Discord.MessageFlags.Ephemeral, content: 'Ops! Algo deu errado!' });
    } else {
      command.run(client, interaction);
    }
  }
});

const config = require('./config');
client.login(config.discord.token);

process.on('unhandledRejection', (reason, p) => {
  console.error('[ Event Error: unhandledRejection ]', p, 'reason:', reason);
});
process.on("uncaughtException", (err, origin) => {
  console.error('[ Event Error: uncaughtException ]', err, origin);
});
process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.error('[ Event Error: uncaughtExceptionMonitor ]', err, origin);
});


// DATABASE

const rootdir = process.cwd();
const { QuickDB } = require("quick.db");
const { join } = require("path");

const db = {
  staffs: new QuickDB({ table: "staffs", filePath: join(process.cwd(), "database/staffs.sqlite") }),
  channels: new QuickDB({ table: "channels", filePath: join(process.cwd(), "database/channels.sqlite") }),
};

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    // Caso o botão de 'Ver Avaliações' seja pressionado
    if (interaction.customId === "showEvaluations") {
      // Recuperar o staff a partir do ID do usuário
      const staffIndex = interaction.message.embeds[0].fields.find(field => field.name === 'ID').value; // Pegue o ID do staff da embed
      const existingStaff = await db.staffs.all();
      const staffData = existingStaff.find(staff => staff.id === staffIndex); // Encontrar o staff no banco

      if (!staffData) {
        return interaction.reply({
          content: `Não há um staff com o ID ${staffIndex}.`,
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      const { evaluations = [] } = staffData.value;

      const evaluationList = evaluations.length
        ? evaluations.map((evalData, index) => `**Nota:** ${evalData.nota}\n**Descrição:** ${evalData.descricao || 'Sem descrição'}`).join('\n\n')
        : 'Nenhuma avaliação encontrada.';

      // Criar a embed para mostrar as avaliações
      const evaluationEmbed = new Discord.EmbedBuilder()
        .setColor(cor)
        .setTitle(`Avaliações de ${staffData.value.name}`)
        .setDescription(evaluationList)
        .setFooter({ text: "Clube do Bala", iconURL: "https://cdn.discordapp.com/emojis/1305569586355109929.png?size=2048" })

      // Responder com as avaliações
      await interaction.reply({
        embeds: [evaluationEmbed],
        flags: Discord.MessageFlags.Ephemeral,
      });
    }
    if (interaction.customId === "avaliacao") {
      if (!interaction.guild.channels.cache.get(await db.channels.get(`canal_logs_${interaction.guild.id}`))) {
        return interaction.reply({ content: "O sistema está desativado.", flags: Discord.MessageFlags.Ephemeral });
      }
      const modal = new Discord.ModalBuilder()
        .setCustomId("Modal")
        .setTitle("Avaliação");

      const pergunta1 = new Discord.TextInputBuilder()
        .setCustomId("pergunta1")
        .setLabel("Staff")
        .setMaxLength(2)
        .setMinLength(1)
        .setPlaceholder("Escreva aqui o ID do staff avaliado")
        .setRequired(true)
        .setStyle(Discord.TextInputStyle.Short);

      const pergunta2 = new Discord.TextInputBuilder()
        .setCustomId("pergunta2")
        .setLabel("Nota")
        .setMaxLength(2)
        .setMinLength(1)
        .setPlaceholder("Escreva aqui uma nota de 0 a 10")
        .setRequired(true)
        .setStyle(Discord.TextInputStyle.Short);

      const pergunta3 = new Discord.TextInputBuilder()
        .setCustomId("pergunta3")
        .setLabel("Descrição")
        .setMaxLength(100)
        .setMinLength(1)
        .setPlaceholder("Descreva aqui a sua avaliação(opcional)")
        .setRequired(false)
        .setStyle(Discord.TextInputStyle.Paragraph);

      modal.addComponents(
        new Discord.ActionRowBuilder().addComponents(pergunta1),
        new Discord.ActionRowBuilder().addComponents(pergunta2),
        new Discord.ActionRowBuilder().addComponents(pergunta3)
      );

      await interaction.showModal(modal);
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === "Modal") {
      let resposta1 = interaction.fields.getTextInputValue("pergunta1");
      let resposta2 = interaction.fields.getTextInputValue("pergunta2");
      let resposta3 = interaction.fields.getTextInputValue("pergunta3");

      if (!resposta1) resposta1 = "Não informado";
      if (!resposta2) resposta2 = "Não informado";
      if (!resposta3) resposta3 = "Não informado";


      // Verificar se a resposta 1 eh numérica
      if (isNaN(resposta1)) {
        return interaction.reply({
          content: "Por favor, insira apenas números na resposta 1.",
          flags: Discord.MessageFlags.Ephemeral
        });
      }

      // Verificar se a resposta 2 eh numérica
      if (isNaN(resposta2)) {
        return interaction.reply({
          content: "Por favor, insira apenas números na resposta 2.",
          flags: Discord.MessageFlags.Ephemeral
        });
      }

      // Verificar se o staff está registrado
      const staff = await db.staffs.get(resposta1.toString());
      if (!staff) {
        return interaction.reply({
          content: `Não há um staff registrado com o ID ${resposta1}.`,
          flags: Discord.MessageFlags.Ephemeral
        });
      }

      // Verificar e corrigir inconsistências no formato
      if (!Array.isArray(staff.evaluations)) {
        staff.evaluations = [];
      }

      // Adicionar a nova avaliação
      staff.evaluations.push({
        nota: parseFloat(resposta2), // Garantir que a nota seja um número
        descricao: resposta3 || "Sem descrição",
      });

      // Calcular a média das avaliações
      const notas = staff.evaluations.map((av) => av.nota); // Pegar todas as notas
      const soma = notas.reduce((acc, nota) => acc + nota, 0); // Somar todas as notas
      const media = (soma / notas.length).toFixed(2); // Calcular a média e limitar para 2 casas decimais

      // Salvar a média atualizada no banco de dados
      staff.totalEvaluations = staff.evaluations.length; // Número de avaliações
      staff.average = parseFloat(media); // Atualizar o campo `average` com a nova média
      await db.staffs.set(resposta1.toString(), staff);

      const staffUser = await client.users.fetch(staff.id);

      let embed = new Discord.EmbedBuilder()
        .setColor(cor)
        .setAuthor({ name: "Clube do Bala", iconURL: "https://cdn.discordapp.com/emojis/1305569586355109929.png?size=2048" })
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`Avaliação enviada por ${interaction.user.tag}`)
        .addFields(
          {
            name: `Staff:`,
            value: `${staffUser}`,
            inline: false
          },
          {
            name: `Nota(0 a 10):`,
            value: `${resposta2}`,
            inline: false
          },
          {
            name: `Descrição:`,
            value: `${resposta3}`,
            inline: false
          }
        );

      interaction.reply({ content: `${interaction.user} sua avaliação foi enviada.`, flags: Discord.MessageFlags.Ephemeral });

      const canalLogs = interaction.guild.channels.cache.get(
        await db.channels.get(`canal_logs_${interaction.guild.id}`)
      );
      if (canalLogs) {
        await canalLogs.send({ embeds: [embed] });
      }
    }
  }
});

module.exports = client;
