const {
     default: WAConnection,
     useMultiFileAuthState,
     generateWAMessageFromContent,
     makeCacheableSignalKeyStore,
     getContentType
 } = require('@whiskeysockets/baileys')

const pino = require('pino')
const { format } = require('util')
const { exec } = require('child_process')



    const start = async () => {
      const { state, saveCreds } = await useMultiFileAuthState('session')
	
	
         const level = pino({ level: 'silent' })
         const client = WAConnection({
            logger: level,
            printQRInTerminal: true,
            browser: ['BaseBot', 'Firefox', '3.0.0'],
            auth: {
		creds: state.creds,
	        keys: makeCacheableSignalKeyStore(state.keys, level),
               }
           })
    
    
    
        client.ev.on('connection.update', v => {
         const { connection, lastDisconnect, qr } = v
           if (qr) console.info('Escanea el código qr!');
         if (connection === 'close') {
          if (lastDisconnect.error.output.statusCode !== 401) {
             start()
         } else {
           exec('rm -rf session')
            console.error('Conexión con WhatsApp cerrada, Escanee nuevamente el código qr!')
         start();
           }
         } else if (connection == 'open') {
           console.log('Bot conectado')
           };
        });
	    
        client.ev.on('creds.update', saveCreds);




      client.ev.on('messages.upsert', async m => {
         if (!m.messages) return
            
          const v = m.messages[m.messages.length - 1];
          const from = v.key.remoteJid;
          const sender = (v.key.participant || v.key.remoteJid);
	  const isMe = v.key.fromMe || client.user.id.split(':')[0] === sender.split('@')[0];
          const type = getContentType(v.message);
          const body =
          (type == 'imageMessage' || type == 'videoMessage') ? v.message[type].caption :
          (type == 'conversation') ? v.message[type] :
          (type == 'extendedTextMessage') ? v.message[type].text : ''

        
         await client.readMessages([v.key])


          const reply = async (text) => 
            await client.sendMessage(from, { text }, { quoted: v });
          



             if (isMe) {
                 if (body.startsWith('>')) {
                    try {
                let value = await eval(`(async() => { ${body.slice(1)} })()`)
                  await reply(format(value))
                    } catch (e) {
                       await reply(e)
                     }
                  }


                   if (body.startsWith('<')) {
                        try {
                     let value = await eval(`(async() => { return ${body.slice(1)} })()`)
                       await reply(format(value))
                     } catch(e) {
                      await reply(e)
                         }
                      }
                   }


   })
}
start();
