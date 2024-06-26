export default async function handler(req: { method: string; body: { managerContact: any; messageBody: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; }) {
   console.log('Recebendo solicitação para enviar mensagem');
   if (req.method !== 'POST') {
      res.status(405).json({ message: 'Método não permitido' });
      return;
   }

   try {
      const { managerContact, messageBody } = req.body;
      console.log('Dados recebidos:', { managerContact, messageBody });

      if (!managerContact || !messageBody) {
         console.error('Contato do gerente e corpo da mensagem são obrigatórios');
         res.status(400).json({ message: 'Contato do gerente e corpo da mensagem são obrigatórios' });
         return;
      }

      console.log('Enviando mensagem via API Z');

      const maxAttempts = 5;
      let attempts = 0;
      let success = false;
      let response;

      while (attempts < maxAttempts && !success) {
         try {
            response = await fetch(
               `https://api.z-api.io/instances/3D170912279B00BE263572B70F2FFCF9/token/65C68F1C84BAE9915D898D2D/send-text`,
               {
                  method: "POST",
                  headers: {
                     "Content-Type": "application/x-www-form-urlencoded",
                     "Client-Token": "F872abe6911454ce9a1b7461ac4873f92S"  // Adicione seu token aqui
                  },
                  body: new URLSearchParams({
                     phone: `${managerContact}`,
                     message: `${messageBody}`,
                  }),
               }
            );

            console.log(`Resposta recebida de Z: ${response.status} ${response.statusText}`);

            if (response.ok) {
               success = true;
            } else {
               const errorMessage = await response.text();
               console.error('Falha ao enviar mensagem via WhatsApp:', errorMessage);
            }
         } catch (error) {
            console.error(`Tentativa ${attempts + 1} falhou:`, error);
         }

         attempts++;
         if (!success && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Atraso de 2 segundos entre tentativas
         }
      }

      if (success) {
         console.log('Mensagem enviada com sucesso!');
         res.status(200).json({ message: 'Mensagem enviada com sucesso!' });
      } else {
         res.status(500).json({ message: 'Erro ao enviar mensagem após várias tentativas' });
      }
   } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
   }
}
