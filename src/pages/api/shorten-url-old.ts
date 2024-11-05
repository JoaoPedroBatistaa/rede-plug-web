export default async function handler(req: { method: string; body: { originalURL: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message?: string; shortUrl?: any; }): void; new(): any; }; }; }) {
   console.log('Recebendo solicitação para encurtar URL');
   if (req.method !== 'POST') {
      res.status(405).json({ message: 'Método não permitido' });
      return;
   }

   try {
      const { originalURL } = req.body;
      console.log('Dados recebidos:', originalURL);

      if (!originalURL) {
         console.error('URL original é obrigatória');
         res.status(400).json({ message: 'URL original é obrigatória' });
         return;
      }

      const payload = {
         originalURL,
         domain: "fet9.short.gy",
      };

      console.log('Enviando payload para short.io:', payload);

      const maxAttempts = 5;
      let attempts = 0;
      let success = false;
      let data;

      while (attempts < maxAttempts && !success) {
         try {
            const response = await fetch("https://api.short.io/links", {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
                  Authorization: `sk_vccmCLZ2nnJV3MqI`,
               },
               body: JSON.stringify(payload),
            });

            console.log(`Resposta recebida de short.io: ${response.status} ${response.statusText}`);

            data = await response.json();
            console.log('Dados da resposta:', data);

            if (response.ok) {
               success = true;
            } else {
               console.error('Falha ao encurtar URL:', data);
            }
         } catch (error) {
            console.error(`Tentativa ${attempts + 1} falhou:`, error);
         }

         attempts++;
         if (!success && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Atraso de 2 segundos entre tentativas
         }
      }

      if (success) {
         const shortUrl = data.secureShortURL || data.shortURL;
         console.log('URL encurtada:', shortUrl);
         res.status(200).json({ shortUrl });
      } else {
         res.status(500).json({ message: 'Erro ao encurtar URL após várias tentativas' });
      }
   } catch (error) {
      console.error('Erro ao encurtar URL:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
   }
}
