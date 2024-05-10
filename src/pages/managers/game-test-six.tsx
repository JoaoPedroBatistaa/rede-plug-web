import Head from "next/head";
import { useRouter } from "next/router";
import styles from "../../styles/ProductFoam.module.scss";

import HeaderNewProduct from "@/components/HeaderNewTask";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import { db, storage } from "../../../firebase";

import LoadingOverlay from "@/components/Loading";

interface Nozzle {
  nozzleNumber: string;
  product: string;
}

export default function NewPost() {
  const router = useRouter();

  const docId = router.query.docId;
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!docId) return;

      try {
        const docRef = doc(db, "MANAGERS", docId as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetchedData = docSnap.data();

          // @ts-ignore
          setData(fetchedData);
          setDate(fetchedData.date);
          setTime(fetchedData.time);

          console.log(fetchedData); // Verifica se os dados foram corretamente buscados
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error getting document:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [docId]);

  const [isLoading, setIsLoading] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [managerName, setManagerName] = useState("");
  const [nozzles, setNozzles] = useState<Nozzle[]>([]);
  const [encerranteImages, setEncerranteImages] = useState<File[]>([]);
  const [encerranteFileNames, setEncerranteFileNames] = useState<string[]>([]);

  const encerranteRefs = useRef([]);

  const handleImageChange = (
    index: number,
    event: { target: { files: any } } | undefined
  ) => {
    // @ts-ignore
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setEncerranteImages((prev) => {
        const newImages = [...prev];
        newImages[index] = file;
        return newImages;
      });
      setEncerranteFileNames((prev) => {
        const newFileNames = [...prev];
        newFileNames[index] = file.name;
        return newFileNames;
      });
    }
  };

  useEffect(() => {
    const postName = localStorage.getItem("userPost");

    if (postName) {
      const fetchPostDetails = async () => {
        try {
          const postsRef = collection(db, "POSTS");
          const q = query(postsRef, where("name", "==", postName));
          const querySnapshot = await getDocs(q);

          querySnapshot.forEach((doc) => {
            const postData = doc.data();
            setNozzles(postData.nozzles || []);
          });
        } catch (error) {
          console.error("Error fetching post details:", error);
        }
      };

      fetchPostDetails();
    }
  }, []);

  const saveGameTest = async () => {
    setIsLoading(true);

    let missingField = "";
    const today = new Date().toISOString().slice(0, 10);

    if (!date) missingField = "Data";
    else if (date !== today) {
      toast.error("Você deve cadastrar a data correta de hoje!");
      setIsLoading(false);

      return;
    } else if (!time) missingField = "Hora";
    // else if (!managerName) missingField = "Nome do Gerente";
    // @ts-ignore
    else if (encerranteImages.length === 0)
      missingField = "Fotos do teste do game";

    if (missingField) {
      toast.error(`Por favor, preencha o campo obrigatório: ${missingField}.`);
      setIsLoading(false);

      return;
    }

    const userName = localStorage.getItem("userName");
    const postName = localStorage.getItem("userPost");

    const managersRef = collection(db, "MANAGERS");
    const q = query(
      managersRef,
      where("date", "==", date),
      where("userName", "==", userName),
      where("id", "==", "teste-game-proveta-6h")
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      toast.error("O teste do game das 6h já foi cadastrado hoje!");
      setIsLoading(false);

      return;
    }

    const nozzleClosureData = {
      date,
      time,
      managerName: userName,
      userName,
      postName,
      images: [],
      id: "teste-game-proveta-6h",
    };

    // @ts-ignore
    const uploadPromises = encerranteImages.map(
      (imageFile: Blob | ArrayBuffer, index: string | number) =>
        uploadImageAndGetUrl(
          imageFile,
          // @ts-ignore
          `gameTest/${date}/${imageFile.name}_${Date.now()}`
        ).then((imageUrl) => {
          return {
            // @ts-ignore
            fileName: encerranteFileNames[index],
            imageUrl,
          };
        })
    );

    try {
      const images = await Promise.all(uploadPromises);
      // @ts-ignore
      nozzleClosureData.images = images;

      const docRef = await addDoc(
        collection(db, "MANAGERS"),
        nozzleClosureData
      );
      console.log("Teste do game salvo com ID: ", docRef.id);

      await sendMessage(nozzleClosureData);

      toast.success("Teste do game salvo com sucesso!");
      router.push("/manager-six-routine");
    } catch (error) {
      console.error("Erro ao salvar o teste do game: ", error);
      toast.error("Erro ao salvar o teste do game.");
    }
  };

  async function uploadImageAndGetUrl(
    imageFile: Blob | ArrayBuffer,
    path: string | undefined
  ) {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, imageFile);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  }

  function formatDate(dateString: string | number | Date) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1); // Adicionando um dia
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().substr(-2);
    return `${day}/${month}/${year}`;
  }

  async function shortenUrl(originalUrl: string): Promise<string> {
    const payload = {
      originalURL: originalUrl,
      domain: "ewja.short.gy", // Substitua pelo seu domínio personalizado
    };

    const response = await fetch("https://api.short.io/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${process.env.URL_SHORTENER_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Falha ao encurtar URL:", data);
      throw new Error(`Erro ao encurtar URL: ${data.message}`);
    }

    return data.secureShortURL || data.shortURL; // Usa o campo correto conforme a resposta da API
  }

  async function sendMessage(data: {
    date: string | number | Date;
    images: any[];
    time: any;
    postName: any;
    managerName: any;
  }) {
    const formattedDate = formatDate(data.date); // Assumindo uma função de formatação de data existente

    const imagesDescription = await Promise.all(
      data.images.map(async (image, index) => {
        const shortUrl = await shortenUrl(image.imageUrl);
        return `*Bico ${index + 1}:* ${shortUrl}\n`;
      })
    ).then((descriptions) => descriptions.join("\n"));
    // Montar o corpo da mensagem
    const messageBody = `*Novo Teste do Game às 6h*\n\nData: ${formattedDate}\nHora: ${data.time}\nPosto: ${data.postName}\nGerente: ${data.managerName}\n\n*Detalhes das Imagens*\n\n${imagesDescription}`;

    // Enviar a mensagem via Twilio
    const response = await fetch(
      "https://api.twilio.com/2010-04-01/Accounts/ACb0e4bbdd08e851e23384532bdfab6020/Messages.json",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${process.env.WHATSAPP_API_KEY}`)}`,

          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: "whatsapp:+553899624092", // Substitua pelo número correto
          From: "whatsapp:+14155238886",
          Body: messageBody,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Falha ao enviar mensagem via WhatsApp");
    }

    console.log("Mensagem do teste do game enviada com sucesso!");
  }

  return (
    <>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap');
        `}</style>
      </Head>

      <HeaderNewProduct></HeaderNewProduct>
      <ToastContainer />
      <LoadingOverlay isLoading={isLoading} />

      <div className={styles.Container}>
        <div className={styles.BudgetContainer}>
          <div className={styles.BudgetHead}>
            <p className={styles.BudgetTitle}>
              Teste do game na proveta de 1L 6h
            </p>
            <div className={styles.BudgetHeadS}>
              {!docId && (
                <button className={styles.FinishButton} onClick={saveGameTest}>
                  <img
                    src="./finishBudget.png"
                    alt="Finalizar"
                    className={styles.buttonImage}
                  />
                  <span className={styles.buttonText}>Cadastrar teste</span>
                </button>
              )}
            </div>
          </div>

          <p className={styles.Notes}>Informe abaixo as informações do teste</p>

          <div className={styles.userContent}>
            <div className={styles.userData}>
              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Data</p>
                  <input
                    id="date"
                    type="date"
                    className={styles.Field}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder=""
                  />
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Hora</p>
                  <input
                    id="time"
                    type="time"
                    className={styles.Field}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder=""
                  />
                </div>
              </div>

              {docId &&
                // @ts-ignore
                data?.images.map((image, index) => (
                  <div key={index} className={styles.InputField}>
                    <p className={styles.titleTank}>Bico {index + 1}</p>
                    <p className={styles.FieldLabel}>Imagem do teste</p>

                    {image && (
                      <div>
                        <img
                          src={image.imageUrl}
                          alt={`Preview do encerrante do bico ${index + 1}`}
                          style={{
                            maxWidth: "17.5rem",
                            height: "auto",
                            border: "1px solid #939393",
                            borderRadius: "20px",
                          }}
                          onLoad={() =>
                            // @ts-ignore
                            URL.revokeObjectURL(image)
                          }
                        />
                        <p className={styles.fileName}>{image.fileName}</p>
                      </div>
                    )}
                  </div>
                ))}

              {nozzles.map((nozzle, index) => (
                <div key={nozzle.nozzleNumber} className={styles.InputField}>
                  <p className={styles.titleTank}>
                    Bico {nozzle.nozzleNumber} - {nozzle.product}{" "}
                  </p>
                  <p className={styles.FieldLabel}>Imagem do teste</p>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    // @ts-ignore
                    ref={(el) => (encerranteRefs.current[index] = el)}
                    onChange={(event) => handleImageChange(index, event)}
                  />
                  <button
                    // @ts-ignore
                    onClick={() => encerranteRefs.current[index]?.click()}
                    className={styles.MidiaField}
                  >
                    Carregue sua foto
                  </button>
                  {encerranteImages[index] && (
                    <div>
                      <img
                        src={URL.createObjectURL(encerranteImages[index])}
                        alt={`Preview do encerrante do bico ${nozzle.nozzleNumber}`}
                        style={{
                          maxWidth: "17.5rem",
                          height: "auto",
                          border: "1px solid #939393",
                          borderRadius: "20px",
                        }}
                        onLoad={() =>
                          // @ts-ignore
                          URL.revokeObjectURL(encerranteImages[index])
                        }
                      />
                      <p className={styles.fileName}>
                        {encerranteFileNames[index]}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.Copyright}>
            <p className={styles.Copy}>
              © Rede Plug 2024, todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </>
  );
}