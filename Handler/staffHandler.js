const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const { join } = require("path");
const cor = require('../config').discord.color

const db = {
  staffs: new QuickDB({ table: "staffs", filePath: join(process.cwd(), "database/staffs.sqlite") }),
  channels: new QuickDB({ table: "channels", filePath: join(process.cwd(), "database/channels.sqlite") }),
  messages: new QuickDB({ table: "messages", filePath: join(process.cwd(), "database/messages.sqlite") })
};

const STAFF_MESSAGE_ID = 'staffMessageId'; // ID da mensagem listando staffs
const STAFF_CHANNEL_ID = 'staffChannelId'; // ID do canal onde a mensagem é enviada

/**
 * Atualiza a mensagem listando os staffs no canal especificado.
 * @param {Client} client O cliente do Discord.
 */
async function updateStaffMessage(client) {
  const staffChannelId = await db.channels.get(STAFF_CHANNEL_ID);
  if (!staffChannelId) return;

  const staffChannel = client.channels.cache.get(staffChannelId);
  if (!staffChannel) return;

  // Recuperar a mensagem já enviada (se existir)
  const staffMessageId = await db.messages.get(STAFF_MESSAGE_ID);
  let staffMessage;

  if (staffMessageId) {
    try {
      staffMessage = await staffChannel.messages.fetch(staffMessageId);
    } catch { 
      // Se não encontrar a mensagem, deixamos staffMessage como undefined
    }
  }

  // Recuperar staffs do banco de dados
  const staffList = await db.staffs.all();

  const description = staffList.length
    ? staffList.map((staff, index) => `**・${staff.value.name}** (ID: ${staff.id})`).join('\n')
    : 'Nenhum staff registrado ainda.';

  // Criar ou atualizar a embed
  const embed = new EmbedBuilder()
    .setColor(cor)
    .setTitle('Lista de Staffs')
    .setDescription(description)

  if (staffMessage) {
    // Editar a mensagem existente
    await staffMessage.edit({ embeds: [embed] });
  } else {
    // Enviar uma nova mensagem e salvar o ID
    const newMessage = await staffChannel.send({ embeds: [embed] });
    await db.messages.set(STAFF_MESSAGE_ID, newMessage.id);
  }
}

async function addStaff(client) {
  // Atualizar a mensagem de staffs
  await updateStaffMessage(client);
}

module.exports = {
  updateStaffMessage,
  addStaff,
};
