import HeaderNewProduct from "@/components/HeaderNewTask";
import LoadingOverlay from "@/components/Loading";
import imageCompression from "browser-image-compression";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { uploadBytes } from "firebase/storage";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db, getDownloadURL, ref, storage } from "../../../firebase";
import styles from "../../styles/ProductFoam.module.scss";

async function compressImage(file: File) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
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

export default function NewPost() {
  const router = useRouter();
  const postName = router.query.postName;
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
        const docRef = doc(db, "SUPERVISORS", docId as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetchedData = docSnap.data();
          // @ts-ignore
          setData(fetchedData);
          setDate(fetchedData.date);
          setTime(fetchedData.time);
          setObservations(fetchedData.observations);
          setIsOk(fetchedData.isOk);

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

  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [managerName, setManagerName] = useState("");
  const [isOk, setIsOk] = useState("");
  const [observations, setObservations] = useState("");
  const etanolRef = useRef(null);
  const gcRef = useRef(null);
  const [etanolImage, setEtanolImage] = useState<File | null>(null);
  const [etanolFileName, setEtanolFileName] = useState("");
  const [etanolImageUrl, setEtanolImageUrl] = useState("");
  const [gcImage, setGcImage] = useState<File | null>(null);
  const [gcFileName, setGcFileName] = useState("");
  const [gcImageUrl, setGcImageUrl] = useState("");

  const handleEtanolImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // @ts-ignore
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true);
      try {
        let compressedFile = file;
        if (file.type.startsWith("image/")) {
          compressedFile = await compressImage(file);
        }
        const imageUrl = await uploadImageAndGetUrl(
          compressedFile,
          `supervisors/${getLocalISODate()}/${
            compressedFile.name
          }_${Date.now()}`
        );
        setEtanolImage(compressedFile);
        setEtanolFileName(compressedFile.name);
        setEtanolImageUrl(imageUrl);
      } catch (error) {
        console.error("Erro ao fazer upload da imagem:", error);
        toast.error("Erro ao fazer upload da imagem.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGcImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // @ts-ignore
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true);
      try {
        let compressedFile = file;
        if (file.type.startsWith("image/")) {
          compressedFile = await compressImage(file);
        }
        const imageUrl = await uploadImageAndGetUrl(
          compressedFile,
          `supervisors/${getLocalISODate()}/${
            compressedFile.name
          }_${Date.now()}`
        );
        setGcImage(compressedFile);
        setGcFileName(compressedFile.name);
        setGcImageUrl(imageUrl);
      } catch (error) {
        console.error("Erro ao fazer upload da imagem:", error);
        toast.error("Erro ao fazer upload da imagem.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getLocalISODate = () => {
    const date = new Date();
    date.setHours(date.getHours() - 3);
    return date.toISOString().slice(0, 10);
  };

  const saveMeasurement = async () => {
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
    else if (!isOk) missingField = "Está ok?";
    else if (!etanolImageUrl && !gcImageUrl)
      missingField = "Fotos do Teste dos Combustíveis";
    if (missingField) {
      toast.error(`Por favor, preencha o campo obrigatório: ${missingField}.`);
      setIsLoading(false);
      return;
    }

    const userName = localStorage.getItem("userName");

    const managersRef = collection(db, "SUPERVISORS");
    const q = query(
      managersRef,
      where("date", "==", date),
      where("id", "==", "notas-fiscais"),
      where("userName", "==", userName),
      where("postName", "==", postName)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      toast.error("A tarefa notas fiscais já foi feita hoje!");
      setIsLoading(false);
      return;
    }

    const taskData = {
      date,
      time,
      supervisorName: userName,
      userName,
      postName,
      isOk,
      observations,
      images: [],
      id: "notas-fiscais",
    };

    const uploadPromises = [];
    if (etanolImageUrl) {
      const etanolPromise = Promise.resolve({
        type: "Imagem da tarefa",
        imageUrl: etanolImageUrl,
        fileName: etanolFileName,
      });
      uploadPromises.push(etanolPromise);
    }

    if (gcImageUrl) {
      const gcPromise = Promise.resolve({
        type: "Imagem 02 da tarefa",
        imageUrl: gcImageUrl,
        fileName: gcFileName,
      });
      uploadPromises.push(gcPromise);
    }

    try {
      const images = await Promise.all(uploadPromises);
      // @ts-ignore
      taskData.images = images;

      sendMessage(taskData);

      const docRef = await addDoc(collection(db, "SUPERVISORS"), taskData);
      console.log("Tarefa salva com ID: ", docRef.id);

      toast.success("Tarefa salva com sucesso!");
      // @ts-ignore
      router.push(`/supervisors-routine?post=${encodeURIComponent(postName)}`);
    } catch (error) {
      console.error("Erro ao salvar os dados da tarefa: ", error);
      toast.error("Erro ao salvar a medição.");
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
    date: string | number | Date;
    isOk: any;
    observations: any;
    images: any[];
    time: any;
    postName: any;
    supervisorName: any;
  }) {
    const formattedDate = formatDate(data.date);

    const status = data.isOk === "yes" ? "OK" : "NÃO OK";
    const observationsMsg = data.observations
      ? `*Observações:* ${data.observations}`
      : "_*Sem observações adicionais*_";

    let imagesDescription = "";
    if (data.images && data.images.length > 0) {
      imagesDescription = await Promise.all(
        data.images.map(async (image, index) => {
          const shortUrl = await shortenUrl(image.imageUrl);
          return `*Imagem ${index + 1}:* ${shortUrl}\n`;
        })
      ).then((descriptions) => descriptions.join(""));
    }

    const messageBody = `*Notas Fiscais*\n\n*Data:* ${formattedDate}\n*Hora:* ${data.time}\n*Posto:* ${data.postName}\n*Supervisor:* ${data.supervisorName}\n\n*Status:* ${status}\n${imagesDescription}\n\n${observationsMsg}`;

    const postsRef = collection(db, "USERS");
    const q = query(postsRef, where("name", "==", data.supervisorName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error("Nenhum supervisor encontrado com o nome especificado.");
      throw new Error("Supervisor não encontrado");
    }

    const postData = querySnapshot.docs[0].data();
    const managerContact = postData.contact;

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

    console.log(
      "Mensagem de verificação de notas fiscais enviada com sucesso!"
    );
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
            <p className={styles.BudgetTitle}>Notas fiscais</p>
            <div className={styles.BudgetHeadS}>
              {!docId && (
                <button
                  className={styles.FinishButton}
                  onClick={saveMeasurement}
                >
                  <img
                    src="/finishBudget.png"
                    alt="Finalizar"
                    className={styles.buttonImage}
                  />
                  <span className={styles.buttonText}>Cadastrar tarefa</span>
                </button>
              )}
            </div>
          </div>

          <p className={styles.Notes}>
            Informe abaixo as informações das notas fiscais
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
                  <p className={styles.FieldLabel}>OK?</p>
                  <select
                    id="isOk"
                    className={styles.SelectField}
                    value={isOk}
                    onChange={(e) => setIsOk(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Observações</p>
                  <textarea
                    id="observations"
                    className={styles.Field}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {docId &&
                // @ts-ignore
                data?.images.map((image, index) => (
                  <div key={index} className={styles.InputField}>
                    <p className={styles.titleTank}>Imagem {index + 1}</p>
                    <p className={styles.FieldLabel}>Imagem da maquininha</p>

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

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Imagem da tarefa</p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    ref={etanolRef}
                    onChange={handleEtanolImageChange}
                  />
                  <button
                    onClick={() =>
                      // @ts-ignore
                      etanolRef.current && etanolRef.current.click()
                    }
                    className={styles.MidiaField}
                  >
                    Carregue sua foto
                  </button>
                  {etanolImage && (
                    <div>
                      <img
                        src={etanolImageUrl}
                        alt="Preview do teste de Etanol"
                        style={{
                          maxWidth: "17.5rem",
                          height: "auto",
                          border: "1px solid #939393",
                          borderRadius: "20px",
                        }}
                      />
                      <p className={styles.fileName}>{etanolFileName}</p>
                    </div>
                  )}
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Imagem 2 da tarefa</p>
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
                        src={gcImageUrl}
                        alt="Preview do teste de Gasolina Comum"
                        style={{
                          maxWidth: "17.5rem",
                          height: "auto",
                          border: "1px solid #939393",
                          borderRadius: "20px",
                        }}
                      />
                      <p className={styles.fileName}>{gcFileName}</p>
                    </div>
                  )}
                </div>
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
