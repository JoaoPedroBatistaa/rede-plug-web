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

  const docId = router.query.docId;
  const [data, setData] = useState(null);

  useEffect(() => {
    const checkForUpdates = async () => {
      console.log("Checking for updates...");
      const updateDoc = doc(db, "UPDATE", "Lp8egidKNeHs9jQ8ozvs");
      try {
        const updateSnapshot = await getDoc(updateDoc);
        const updateData = updateSnapshot.data();

        if (updateData) {
          console.log("Update data retrieved:", updateData);
          const { date: updateDate, time: updateTime } = updateData;
          const storedDate = localStorage.getItem("loginDate");
          const storedTime = localStorage.getItem("loginTime");

          if (storedDate && storedTime) {
            console.log("Stored date and time:", storedDate, storedTime);
            const updateDateTime = new Date(
              `${updateDate.replace(/\//g, "-")}T${updateTime}`
            );
            const storedDateTime = new Date(`${storedDate}T${storedTime}`);

            console.log("Update date and time:", updateDateTime);
            console.log("Stored date and time:", storedDateTime);

            const now = new Date();
            const date = now
              .toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
              .split("/")
              .reverse()
              .join("-");
            const time = now.toLocaleTimeString("pt-BR", {
              hour12: false,
              timeZone: "America/Sao_Paulo",
            });

            if (
              !isNaN(updateDateTime.getTime()) &&
              !isNaN(storedDateTime.getTime())
            ) {
              if (storedDateTime < updateDateTime) {
                console.log(
                  "Stored data is outdated. Clearing cache and reloading..."
                );
                // Clear cache and reload
                caches
                  .keys()
                  .then((names) => {
                    for (let name of names) caches.delete(name);
                  })
                  .then(() => {
                    localStorage.setItem("loginDate", date);
                    localStorage.setItem("loginTime", time);
                    alert("O sistema agora está na versão mais recente");
                    window.location.reload();
                  });
              } else {
                console.log("Stored data is up to date.");
              }
            } else {
              console.log("Invalid date/time format detected.");
            }
          } else {
            console.log("No stored date and time found.");
          }
        } else {
          console.log("No update data found in the database.");
        }
      } catch (error) {
        console.error("Error fetching update document:", error);
      }
    };

    checkForUpdates();
  }, []);

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
          setCollectValue(fetchedData.collectValue || "");

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

  const [collectValue, setCollectValue] = useState("");

  const [managerName, setManagerName] = useState("");

  const etanolRef = useRef(null);
  const gcRef = useRef(null);

  const [etanolImage, setEtanolImage] = useState<File | null>(null);
  const [etanolFileName, setEtanolFileName] = useState("");
  const [etanolImageUrl, setEtanolImageUrl] = useState<string | null>(null);
  const [gcImage, setGcImage] = useState<File | null>(null);
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
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setIsLoading(true);
      try {
        let processedFile = file;

        // Verifica se o arquivo é uma imagem antes de comprimir
        if (file.type.startsWith("image/")) {
          processedFile = await compressImage(file);
        }

        const imageUrl = await uploadImageAndGetUrl(
          processedFile,
          `collect/${getLocalISODate()}/etanol_${
            processedFile.name
          }_${Date.now()}`
        );

        setEtanolImage(processedFile);
        setEtanolFileName(processedFile.name);
        setEtanolImageUrl(imageUrl);
      } catch (error) {
        console.error("Erro ao fazer upload do arquivo de etanol:", error);
        toast.error("Erro ao salvar o arquivo de etanol.");
      } finally {
        setIsLoading(false);
      }
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
    else if (!etanolImage) missingField = "Foto do Recolhe";

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
      where("id", "==", "recolhe-6h")
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      toast.error("O recolhe das 6h já foi cadastrado hoje!");
      setIsLoading(false);
      return;
    }

    const fuelTestData = {
      date,
      time,
      managerName: userName,
      userName,
      postName,
      collectValue,
      images: etanolImageUrl
        ? [
            {
              type: "Etanol",
              imageUrl: etanolImageUrl,
              fileName: etanolFileName,
            },
          ]
        : [],
      id: "recolhe-6h",
    };

    try {
      await sendMessage(fuelTestData);

      const docRef = await addDoc(collection(db, "MANAGERS"), fuelTestData);
      console.log("Recolhe salvo com ID: ", docRef.id);

      toast.success("Recolhe salvo com sucesso!");
      router.push("/manager-six-routine");
    } catch (error) {
      console.error("Erro ao salvar o recolhe: ", error);
      toast.error("Erro ao salvar o recolhe.");
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
      const response = await fetch("/api/shorten-url-old", {
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
    date: string | number | Date;
    images: any[];
    time: any;
    collectValue: any;
    postName: any;
    managerName: any;
  }) {
    const formattedDate = formatDate(data.date);

    // Encurtar URLs dos arquivos e construir a descrição
    const filesDescription = await Promise.all(
      data.images.map(async (file, index) => {
        const shortUrl = await shortenUrl(file.imageUrl);
        return `*Arquivo ${index + 1}:* ${shortUrl}\n`;
      })
    ).then((descriptions) => descriptions.join("\n"));

    // Montar o corpo da mensagem
    const messageBody = `*Novo Recolhe às 6h*\n\n*Data:* ${formattedDate}\n*Hora:* ${data.time}\n*Posto:* ${data.postName}\n*Gerente:* ${data.managerName}\n\n*Valor do recolhe:* ${data.collectValue}\n\n*Detalhes dos Arquivos*\n\n${filesDescription}`;

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

    console.log("Mensagem da atualização do recolhe enviada com sucesso!");
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
            <p className={styles.BudgetTitle}>Recolhe 6h</p>
            <div className={styles.BudgetHeadS}>
              {!docId && (
                <button className={styles.FinishButton} onClick={saveFuelTest}>
                  <img
                    src="/finishBudget.png"
                    alt="Finalizar"
                    className={styles.buttonImage}
                  />
                  <span className={styles.buttonText}>Cadastrar recolhe</span>
                </button>
              )}
            </div>
          </div>

          <p className={styles.Notes}>
            Informe abaixo as informações dos testes do recolhe
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
                  <p className={styles.FieldLabel}>Valor do Recolhe</p>
                  <input
                    id="recolheValue"
                    type="text"
                    className={styles.Field}
                    value={collectValue}
                    onChange={(e) => setCollectValue(e.target.value)}
                    placeholder=""
                  />
                </div>
              </div>

              {docId &&
                // @ts-ignore
                data?.images.map((image, index) => (
                  <div key={index} className={styles.InputField}>
                    <p className={styles.titleTank}>Recolhe</p>
                    <p className={styles.FieldLabel}>Imagem do recolhe</p>

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
                        <a
                          href={image.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.openMediaLink}
                        >
                          Abrir mídia
                        </a>
                      </div>
                    )}
                  </div>
                ))}

              <div className={styles.InputField}>
                <p className={styles.FieldLabel}>Imagem do recolhe</p>
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
