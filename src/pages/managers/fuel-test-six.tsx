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

  const [isLoading, setIsLoading] = useState(false);

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

          console.log(fetchedData);
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

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [managerName, setManagerName] = useState("");

  const etanolRef = useRef(null);
  const gcRef = useRef(null);

  const [etanolImage, setEtanolImage] = useState<File | null>(null);
  const [etanolFileName, setEtanolFileName] = useState("");

  const [gcImage, setGcImage] = useState<File | null>(null);
  const [gcFileName, setGcFileName] = useState("");

  const handleEtanolImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // @ts-ignore
    const file = event.target.files[0];
    if (file) {
      setEtanolImage(file);
      setEtanolFileName(file.name);
    }
  };

  const handleGcImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // @ts-ignore
    const file = event.target.files[0];
    if (file) {
      setGcImage(file);
      setGcFileName(file.name);
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
          });
        } catch (error) {
          console.error("Error fetching post details:", error);
        }
      };

      fetchPostDetails();
    }
  }, []);

  const saveFuelTest = async () => {
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
    else if (!etanolImage && !gcImage)
      missingField = "Fotos do Teste dos Combustíveis";

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
      where("id", "==", "teste-combustiveis-6h")
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      toast.error("O teste dos combustíveis das 6h já foi cadastrado hoje!");
      setIsLoading(false);

      return;
    }

    const fuelTestData = {
      date,
      time,
      managerName: userName,
      userName,
      postName,
      images: [],
      id: "teste-combustiveis-6h",
    };

    // Preparar os uploads das imagens
    const uploadPromises = [];
    if (etanolImage) {
      const etanolPromise = uploadImageAndGetUrl(
        etanolImage,
        `fuelTests/${date}/etanol_${etanolFileName}_${Date.now()}`
      ).then((imageUrl) => ({
        type: "Etanol",
        imageUrl,
        fileName: etanolFileName,
      }));
      uploadPromises.push(etanolPromise);
    }

    if (gcImage) {
      const gcPromise = uploadImageAndGetUrl(
        gcImage,
        `fuelTests/${date}/gc_${gcFileName}_${Date.now()}`
      ).then((imageUrl) => ({ type: "GC", imageUrl, fileName: gcFileName }));
      uploadPromises.push(gcPromise);
    }

    try {
      const images = await Promise.all(uploadPromises);
      // @ts-ignore
      fuelTestData.images = images;

      const docRef = await addDoc(collection(db, "MANAGERS"), fuelTestData);
      console.log("Teste dos combustíveis salvo com ID: ", docRef.id);

      await sendMessage(fuelTestData);

      toast.success("Teste dos combustíveis salvo com sucesso!");
      router.push("/manager-six-routine");
    } catch (error) {
      console.error("Erro ao salvar o teste dos combustíveis: ", error);
      toast.error("Erro ao salvar o teste dos combustíveis.");
    }
  };

  async function uploadImageAndGetUrl(imageFile: File, path: string) {
    const storageRef = ref(storage, path);
    const uploadResult = await uploadBytes(storageRef, imageFile);
    const downloadUrl = await getDownloadURL(uploadResult.ref);
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
      domain: "ewja.short.gy", // Use seu domínio personalizado
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

    return data.secureShortURL || data.shortURL;
  }

  async function sendMessage(data: {
    date: any;
    time: any;
    managerName: any;
    userName?: string | null;
    postName: any;
    images: any;
    id?: string;
  }) {
    const formattedDate = formatDate(data.date); // Suponha que você tenha uma função para formatar a data corretamente

    // Construir a descrição das imagens
    const imagesDescription = await Promise.all(
      data.images.map(async (image: { type: any; imageUrl: any }) => {
        const shortUrl = await shortenUrl(image.imageUrl);
        return `*Imagem do ${image.type}:* ${shortUrl}\n`;
      })
    ).then((descriptions) => descriptions.join("\n"));

    // Montar o corpo da mensagem
    const messageBody = `*Novo Teste de Combustíveis às 6h*\n\nData: ${formattedDate}\nHora: ${data.time}\nPosto: ${data.postName}\nGerente: ${data.managerName}\n\n*Imagens do teste*\n\n${imagesDescription}`;

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

    console.log("Mensagem de teste de combustíveis enviada com sucesso!");
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
            <p className={styles.BudgetTitle}>Teste dos combustíveis 6h</p>
            <div className={styles.BudgetHeadS}>
              {!docId && (
                <button className={styles.FinishButton} onClick={saveFuelTest}>
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

          <p className={styles.Notes}>
            Informe abaixo as informações dos testes dos combustíveis
          </p>

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

              {
                // @ts-ignore
                docId && data && data.images && (
                  <div>
                    {
                      // @ts-ignore
                      data.images.map((image, index) => (
                        <div key={index} className={styles.InputField}>
                          <p className={styles.FieldLabel}>
                            Imagem {image.type}
                          </p>
                          <img
                            src={image.imageUrl}
                            alt={`Preview do teste de ${image.type}`}
                            style={{
                              maxWidth: "17.5rem",
                              height: "auto",
                              border: "1px solid #939393",
                              borderRadius: "20px",
                            }}
                          />
                        </div>
                      ))
                    }
                  </div>
                )
              }

              <div className={styles.InputField}>
                <p className={styles.FieldLabel}>Imagem do teste de Etanol</p>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={etanolRef}
                  onChange={handleEtanolImageChange}
                />
                <button
                  // @ts-ignore
                  onClick={() => etanolRef.current && etanolRef.current.click()}
                  className={styles.MidiaField}
                >
                  Carregue sua foto
                </button>
                {etanolImage && (
                  <div>
                    <img
                      src={URL.createObjectURL(etanolImage)}
                      alt="Preview do teste de Etanol"
                      style={{
                        maxWidth: "17.5rem",
                        height: "auto",
                        border: "1px solid #939393",
                        borderRadius: "20px",
                      }}
                      // @ts-ignore
                      onLoad={() => URL.revokeObjectURL(etanolImage)}
                    />
                    <p className={styles.fileName}>{etanolFileName}</p>
                  </div>
                )}
              </div>
              <div className={styles.InputField}>
                <p className={styles.FieldLabel}>
                  Imagem do teste de Gasolina Comum (GC)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={gcRef}
                  onChange={handleGcImageChange}
                />
                <button
                  // @ts-ignore
                  onClick={() => gcRef.current && gcRef.current.click()}
                  className={styles.MidiaField}
                >
                  Carregue sua foto
                </button>
                {gcImage && (
                  <div>
                    <img
                      src={URL.createObjectURL(gcImage)}
                      alt="Preview do teste de Gasolina Comum"
                      style={{
                        maxWidth: "17.5rem",
                        height: "auto",
                        border: "1px solid #939393",
                        borderRadius: "20px",
                      }}
                      // @ts-ignore
                      onLoad={() => URL.revokeObjectURL(gcImage)}
                    />
                    <p className={styles.fileName}>{gcFileName}</p>
                  </div>
                )}
              </div>
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
