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

      const apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(originalURL)}`;
      console.log('URL da API:', apiUrl);

      const maxAttempts = 5;
      let attempts = 0;
      let success = false;
      let data;

      while (attempts < maxAttempts && !success) {
         try {
            const response = await fetch(apiUrl);
            console.log(`Resposta recebida de is.gd: ${response.status} ${response.statusText}`);
            const text = await response.text();

            // Verifica se a resposta é JSON
            try {
               data = JSON.parse(text);
               console.log('Dados da resposta:', data);

               if (response.ok && !data.errorcode) {
                  success = true;
               } else {
                  console.error('Falha ao encurtar URL:', data);
               }
            } catch (jsonError) {
               console.error('Resposta não é JSON:', text);
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
         const shortUrl = data.shorturl;
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
