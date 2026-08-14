const metaToken = 'EAARmrytIMFkBSPDSeAtMF1EZBOgeylnFdZC6tGijlbJYjrdgJsDuYQy3vZBpmvXZBsD4f8ar7dWwKYXpkAITodAOiJEzWmqH1CR6Wpd80hhwt5SDsVnjSZA4tfe41NOdeV7sZAttncdxbVUQ0y8IUHGcW7SDyKxuZAllQcAoDHEJ1A5FQ8R2GF22HqwoZABrDQZDZD';
const metaPhoneId = '1240632239137751';
const toPhone = '351930663083';

async function run() {
  const resp = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${metaToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'text',
      text: {
        body: '👋 Olá Guilherme! Teste de mensagem direta da Royal Coast via WhatsApp API.'
      }
    })
  });
  const json = await resp.json();
  console.log('RESULT:', JSON.stringify(json, null, 2));
}

run();
