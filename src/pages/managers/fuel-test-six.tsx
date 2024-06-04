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

import imageCompression from "browser-image-compression";

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
        // @ts-ignore
        const docRef = doc(db, "MANAGERS", docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetchedData = docSnap.data();

          setDate(fetchedData.date || "");
          setTime(fetchedData.time || "");
          setEthanolTemperature(fetchedData.ethanolTemperature || "");
          setEthanolWeight(fetchedData.ethanolWeight || "");
          setGasolineQuality(fetchedData.gasolineQuality || "");

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

  const [ethanolTemperature, setEthanolTemperature] = useState("");
  const [ethanolWeight, setEthanolWeight] = useState("");
  const [gasolineQuality, setGasolineQuality] = useState("");

  const [managerName, setManagerName] = useState("");

  const etanolRef = useRef(null);
  const gcRef = useRef(null);

  const [etanolImage, setEtanolImage] = useState<File | null>(null);
  const [etanolImageUrl, setEtanolImageUrl] = useState<File | null>(null);
  const [etanolFileName, setEtanolFileName] = useState("");

  const [gcImage, setGcImage] = useState<File | null>(null);
  const [gcImageUrl, setGcImageUrl] = useState<File | null>(null);
  const [gcFileName, setGcFileName] = useState("");

  async function compressImage(file: File) {
    const options = {
      maxSizeMB: 2, // Tamanho máximo do arquivo final em megabytes
      maxWidthOrHeight: 1920, // Dimensão máxima (largura ou altura) da imagem após a compressão
      useWebWorker: true, // Utiliza Web Workers para melhorar o desempenho
    };

    try {
      console.log(
        `Tamanho original da imagem: ${(file.size / 1024 / 1024).toFixed(2)} MB`
      );
      const compressedFile = await imageCompression(file, options);
      console.log(
        `Tamanho da imagem comprimida: ${(
          compressedFile.size /
          1024 /
          1024
        ).toFixed(2)} MB`
      );
      return compressedFile;
    } catch (error) {
      console.error("Erro ao comprimir imagem:", error);
      throw error;
    }
  }

  const handleEtanolImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setIsLoading(true);
      try {
        let processedFile = file;

        // Verifica se o arquivo é uma imagem antes de comprimir
        if (file.type.startsWith("image/")) {
          processedFile = await compressImage(file);
        }

        const imageUrl = await uploadImageAndGetUrl(
          processedFile,
          `fuelTests/${getLocalISODate()}/etanol_${
            processedFile.name
          }_${Date.now()}`
        );

        setEtanolImage(processedFile);
        setEtanolFileName(processedFile.name);
        // @ts-ignore
        setEtanolImageUrl(imageUrl);
      } catch (error) {
        console.error("Erro ao fazer upload da imagem de etanol:", error);
        toast.error("Erro ao fazer upload da imagem de etanol.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGcImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setIsLoading(true);
      try {
        let processedFile = file;

        // Verifica se o arquivo é uma imagem antes de comprimir
        if (file.type.startsWith("image/")) {
          processedFile = await compressImage(file);
        }

        const imageUrl = await uploadImageAndGetUrl(
          processedFile,
          `fuelTests/${getLocalISODate()}/gc_${
            processedFile.name
          }_${Date.now()}`
        );

        setGcImage(processedFile);
        setGcFileName(processedFile.name);
        // @ts-ignore
        setGcImageUrl(imageUrl);
      } catch (error) {
        console.error(
          "Erro ao fazer upload da imagem de gasolina comum:",
          error
        );
        toast.error("Erro ao fazer upload da imagem de gasolina comum.");
      } finally {
        setIsLoading(false);
      }
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

  const getLocalISODate = () => {
    const date = new Date();
    // Ajustar para o fuso horário -03:00
    date.setHours(date.getHours() - 3);
    return date.toISOString().slice(0, 10);
  };

  const saveFuelTest = async () => {
    setIsLoading(true);

    let missingField = "";
    const today = getLocalISODate();
    console.log(today);

    if (!date) missingField = "Data";
    else if (date !== today) {
      toast.error("Você deve cadastrar a data correta de hoje!");
      setIsLoading(false);
      return;
    } else if (!time) missingField = "Hora";
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

    const images = [];
    if (etanolImageUrl) {
      images.push({
        type: "Etanol",
        imageUrl: etanolImageUrl,
        fileName: etanolFileName,
      });
    }
    if (gcImageUrl) {
      images.push({
        type: "GC",
        imageUrl: gcImageUrl,
        fileName: gcFileName,
      });
    }

    const fuelTestData = {
      date,
      time,
      managerName: userName,
      userName,
      postName,
      ethanolTemperature,
      ethanolWeight,
      gasolineQuality,
      images,
      id: "teste-combustiveis-6h",
    };

    try {
      await sendMessage(fuelTestData);

      const docRef = await addDoc(collection(db, "MANAGERS"), fuelTestData);
      console.log("Teste dos combustíveis salvo com ID: ", docRef.id);

      toast.success("Teste dos combustíveis salvo com sucesso!");
      router.push("/manager-six-routine");
    } catch (error) {
      console.error("Erro ao salvar o teste dos combustíveis: ", error);
      toast.error("Erro ao salvar o teste dos combustíveis.");
    } finally {
      setIsLoading(false);
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
    console.log(`Iniciando encurtamento da URL: ${originalUrl}`);

    try {
      const response = await fetch("/api/shorten-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ originalURL: originalUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Falha ao encurtar URL:", data);
        throw new Error(`Erro ao encurtar URL: ${data.message}`);
      }

      const data = await response.json();
      const shortUrl = data.shortUrl;
      console.log(`URL encurtada: ${shortUrl}`);

      return shortUrl;
    } catch (error) {
      console.error("Erro ao encurtar URL:", error);
      throw error;
    }
  }

  async function sendMessage(data: {
    date: any;
    time: any;
    managerName: any;
    userName?: string | null;
    postName: any;
    images: any;
    id?: string;
    ethanolTemperature: any; // Novo campo
    ethanolWeight: any; // Novo campo
    gasolineQuality: any; // Novo campo
  }) {
    const formattedDate = formatDate(data.date);

    // Construir a descrição das imagens
    const imagesDescription = await Promise.all(
      data.images.map(async (image: { type: any; imageUrl: any }) => {
        const shortUrl = await shortenUrl(image.imageUrl);
        return `*Imagem do ${image.type}:* ${shortUrl}\n`;
      })
    ).then((descriptions) => descriptions.join("\n"));

    // Montar o corpo da mensagem
    const messageBody = `*Novo Teste de Combustíveis às 6h*\n\nData: ${formattedDate}\nHora: ${data.time}\nPosto: ${data.postName}\nGerente: ${data.managerName}\n\n*Temperatura do Etanol:* ${data.ethanolTemperature}\n*Peso do Etanol:* ${data.ethanolWeight}\n*Qualidade da Gasolina:* ${data.gasolineQuality}\n\n*Imagens do teste*\n\n${imagesDescription}`;

    const postsRef = collection(db, "POSTS");
    const q = query(postsRef, where("name", "==", data.postName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error("Nenhum posto encontrado com o nome especificado.");
      throw new Error("Posto não encontrado");
    }

    const postData = querySnapshot.docs[0].data();
    const managerContact = postData.managers[0].contact;

    console.log(managerContact);

    const response = await fetch("/api/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        managerContact,
        messageBody,
      }),
    });

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
                    src="/finishBudget.png"
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
              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Temperatura do Etanol</p>
                  <input
                    id="ethanolTemperature"
                    type="text"
                    className={styles.Field}
                    value={ethanolTemperature}
                    onChange={(e) => setEthanolTemperature(e.target.value)}
                    placeholder=""
                  />
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Peso do Etanol</p>
                  <input
                    id="ethanolWeight"
                    type="text"
                    className={styles.Field}
                    value={ethanolWeight}
                    onChange={(e) => setEthanolWeight(e.target.value)}
                    placeholder=""
                  />
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Qualidade da Gasolina</p>
                  <input
                    id="gasolineQuality"
                    type="text"
                    className={styles.Field}
                    value={gasolineQuality}
                    onChange={(e) => setGasolineQuality(e.target.value)}
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
                  accept="image/*,video/*"
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
                  accept="image/*,video/*"
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
