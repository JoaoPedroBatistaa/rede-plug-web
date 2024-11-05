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
import { useEffect, useRef, useState } from "react";
import { db, getDownloadURL, ref, storage } from "../../../firebase";

import LoadingOverlay from "@/components/Loading";
import imageCompression from "browser-image-compression";
import { uploadBytes } from "firebase/storage";

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

async function uploadImageAndGetUrl(imageFile: File, path: string) {
  const storageRef = ref(storage, path);
  const uploadResult = await uploadBytes(storageRef, imageFile);
  const downloadUrl = await getDownloadURL(uploadResult.ref);
  return downloadUrl;
}

export default function NewPost() {
  const router = useRouter();
  const postName = router.query.postName;

  const docId = router.query.docId;
  const [data, setData] = useState(null);

  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [postCoordinates, setPostCoordinates] = useState({
    lat: null,
    lng: null,
  });
  const [mapUrl, setMapUrl] = useState("");
  const [radiusCoordinates, setRadiusCoordinates] = useState([]);

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
          setIsANPOk(fetchedData.isANPOk || "");
          setIsLicencaOperacaoOk(fetchedData.isLicencaOperacaoOk || "");
          setIsContratoSocialoOk(fetchedData.isContratoSocialOk || "");
          setIsAlvaraFuncionamentoOk(fetchedData.isAlvaraFuncionamentoOk || "");
          setIsBombeirosOk(fetchedData.isBombeirosOk || "");
          setIsEpaeOk(fetchedData.isEpaeOk || "");
          setIsBrigadaOk(fetchedData.isBrigadaOk || "");
          setIsLaudoCompressorOk(fetchedData.isLaudoCompressorOk || "");
          setIsLaudoEstanqueidadeOk(fetchedData.isLaudoEstanqueidadeOk || "");
          setIsLaudoEletricaOk(fetchedData.isLaudoEletricaOk || "");

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

  const [isANPOk, setIsANPOk] = useState("");
  const [isLicencaOperacaoOk, setIsLicencaOperacaoOk] = useState("");
  const [isContratoSocialOk, setIsContratoSocialoOk] = useState("");
  const [isAlvaraFuncionamentoOk, setIsAlvaraFuncionamentoOk] = useState("");
  const [isBombeirosOk, setIsBombeirosOk] = useState("");
  const [isEpaeOk, setIsEpaeOk] = useState("");
  const [isBrigadaOk, setIsBrigadaOk] = useState("");
  const [isLaudoCompressorOk, setIsLaudoCompressorOk] = useState("");
  const [isLaudoEstanqueidadeOk, setIsLaudoEstanqueidadeOk] = useState("");
  const [isLaudoEletricaOk, setIsLaudoEletricaOk] = useState("");
  const [observations, setObservations] = useState("");

  const etanolRef = useRef(null);
  const gcRef = useRef(null);
  const ContratoSocialRef = useRef(null);
  const AlvaraFuncionamentoRef = useRef(null);
  const BombeirosRef = useRef(null);
  const EpaeRef = useRef(null);
  const BrigadaRef = useRef(null);
  const LaudoCompressorRef = useRef(null);
  const LaudoEstanqueidadeRef = useRef(null);
  const LaudoEletricaRef = useRef(null);

  const [etanolImageUrl, setEtanolImageUrl] = useState<string>("");
  const [etanolFileName, setEtanolFileName] = useState("");

  const [gcImageUrl, setGcImageUrl] = useState<string>("");
  const [gcFileName, setGcFileName] = useState("");

  const [contratoSocialImageUrl, setContratoSocialImageUrl] =
    useState<string>("");
  const [contratoSocialFileName, setContratoSocialFileName] = useState("");

  const [alvaraFuncionamentoImageUrl, setAlvaraFuncionamentoImageUrl] =
    useState<string>("");
  const [alvaraFuncionamentoFileName, setAlvaraFuncionamentoFileName] =
    useState("");

  const [bombeirosImageUrl, setBombeirosImageUrl] = useState<string>("");
  const [bombeirosFileName, setBombeirosFileName] = useState("");

  const [epaeImageUrl, setEpaeImageUrl] = useState<string>("");
  const [epaeFileName, setEpaeFileName] = useState("");

  const [brigadaImageUrl, setBrigadaImageUrl] = useState<string>("");
  const [brigadaFileName, setBrigadaFileName] = useState("");

  const [laudoCompressorImageUrl, setLaudoCompressorImageUrl] =
    useState<string>("");
  const [laudoCompressorFileName, setLaudoCompressorFileName] = useState("");

  const [laudoEstanqueidadeImageUrl, setLaudoEstanqueidadeImageUrl] =
    useState<string>("");
  const [laudoEstanqueidadeFileName, setLaudoEstanqueidadeFileName] =
    useState("");

  const [laudoEletricaImageUrl, setLaudoEletricaImageUrl] =
    useState<string>("");
  const [laudoEletricaFileName, setLaudoEletricaFileName] = useState("");

  const fetchCoordinates = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            // @ts-ignore
            lat: position.coords.latitude,
            // @ts-ignore
            lng: position.coords.longitude,
          });
          console.log(
            `Supervisor coordinates obtained: lat=${position.coords.latitude}, lng=${position.coords.longitude}`
          );
        },
        (error) => {
          console.error("Error obtaining location:", error);
          setCoordinates({ lat: null, lng: null });
        }
      );
    } else {
      console.log("Geolocation is not available in this browser.");
    }
  };

  useEffect(() => {
    fetchCoordinates();
  }, [date, time, observations, managerName]);

  useEffect(() => {
    const fetchPostCoordinates = async () => {
      if (!postName) return;

      try {
        const postsRef = collection(db, "POSTS");
        const q = query(postsRef, where("name", "==", postName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const postData = querySnapshot.docs[0].data();
          setPostCoordinates({
            lat: postData.location.lat,
            lng: postData.location.lng,
          });
          console.log("Post coordinates fetched: ", postData.location);
        }
      } catch (error) {
        console.error("Error fetching post coordinates:", error);
      }
    };

    fetchPostCoordinates();
  }, [postName]);

  const calculateCoordinatesInRadius = (
    center: { lat: number; lng: number },
    radius = 200,
    stepSize = 2
  ) => {
    const points = [];
    const earthRadius = 6371000;

    const lat1 = (center.lat * Math.PI) / 180;
    const lng1 = (center.lng * Math.PI) / 180;

    for (let angle = 0; angle < 360; angle += stepSize) {
      const bearing = (angle * Math.PI) / 180;

      for (let dist = 0; dist <= radius; dist += stepSize) {
        const lat2 = Math.asin(
          Math.sin(lat1) * Math.cos(dist / earthRadius) +
            Math.cos(lat1) * Math.sin(dist / earthRadius) * Math.cos(bearing)
        );
        const lng2 =
          lng1 +
          Math.atan2(
            Math.sin(bearing) * Math.sin(dist / earthRadius) * Math.cos(lat1),
            Math.cos(dist / earthRadius) - Math.sin(lat1) * Math.sin(lat2)
          );

        points.push({
          lat: (lat2 * 180) / Math.PI,
          lng: (lng2 * 180) / Math.PI,
        });
      }
    }

    console.log("Radius coordinates calculated: ", points);
    return points;
  };

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setImageUrl: React.Dispatch<React.SetStateAction<string>>,
    setFileName: React.Dispatch<React.SetStateAction<string>>,
    refName: React.RefObject<HTMLInputElement>
  ) => {
    // @ts-ignore
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      setIsLoading(true);
      try {
        const compressedFile = file.type.startsWith("image/")
          ? await compressImage(file)
          : file;
        const path = `supervisors/${new Date().toISOString()}/${
          file.name
        }_${Date.now()}`;
        const imageUrl = await uploadImageAndGetUrl(compressedFile, path);
        setImageUrl(imageUrl);
      } catch (error) {
        toast.error("Erro ao enviar a imagem.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getLocalISODate = () => {
    const date = new Date();
    // Ajustar para o fuso horário -03:00
    date.setHours(date.getHours() - 3);
    return date.toISOString().slice(0, 10);
  };

  const saveMeasurement = async () => {
    setIsLoading(true);

    fetchCoordinates();

    let missingField = "";
    const today = getLocalISODate();
    console.log(today);

    if (!date) missingField = "Data";
    else if (date !== today) {
      toast.error("Você deve cadastrar a data correta de hoje!");
      setIsLoading(false);

      return;
    } else if (!time) missingField = "Hora";
    // else if (!managerName) missingField = "Nome do supervisor";
    else if (!isANPOk) missingField = "ANP ok?";
    else if (!isLicencaOperacaoOk)
      missingField = "Licença de Operação está ok?";
    else if (
      !etanolImageUrl &&
      !gcImageUrl &&
      !contratoSocialImageUrl &&
      !alvaraFuncionamentoImageUrl &&
      bombeirosImageUrl &&
      !epaeImageUrl &&
      brigadaImageUrl &&
      !laudoCompressorImageUrl &&
      !laudoEstanqueidadeImageUrl &&
      !laudoEletricaImageUrl
    )
      missingField = "Fotos do Documento";
    if (missingField) {
      toast.error(`Por favor, preencha o campo obrigatório: ${missingField}.`);
      setIsLoading(false);

      return;
    }

    const userName = localStorage.getItem("userName");
    // const postName = localStorage.getItem("userPost");

    const managersRef = collection(db, "SUPERVISORS");
    const q = query(
      managersRef,
      where("date", "==", date),
      where("id", "==", "documentos"),
      where("userName", "==", userName),
      where("postName", "==", postName)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      toast.error("A tarefa documentos já foi feita hoje!");
      setIsLoading(false);

      return;
    }

    const taskData = {
      date,
      time,
      supervisorName: userName,
      userName,
      postName,
      isANPOk,
      isLicencaOperacaoOk,
      isAlvaraFuncionamentoOk,
      isBombeirosOk,
      isBrigadaOk,
      isContratoSocialOk,
      isEpaeOk,
      isLaudoCompressorOk,
      isLaudoEstanqueidadeOk,
      isLaudoEletricaOk,
      observations,
      coordinates,

      images: [],
      id: "documentos",
    };

    const imagesData = [
      {
        imageUrl: etanolImageUrl,
        fileName: etanolFileName,
        type: "Imagem do ANP",
      },
      {
        imageUrl: gcImageUrl,
        fileName: gcFileName,
        type: "Imagem da Licença de Operação",
      },
      {
        imageUrl: contratoSocialImageUrl,
        fileName: contratoSocialFileName,
        type: "Imagem do contrato social",
      },
      {
        imageUrl: alvaraFuncionamentoImageUrl,
        fileName: alvaraFuncionamentoFileName,
        type: "Imagem do Alvará de funcionamento",
      },
      {
        imageUrl: bombeirosImageUrl,
        fileName: bombeirosFileName,
        type: "Imagem do Alvará dos Bombeiros",
      },
      {
        imageUrl: epaeImageUrl,
        fileName: epaeFileName,
        type: "Imagem do EPAE",
      },
      {
        imageUrl: brigadaImageUrl,
        fileName: brigadaFileName,
        type: "Imagem do Brigada",
      },
      {
        imageUrl: laudoCompressorImageUrl,
        fileName: laudoCompressorFileName,
        type: "Imagem do Laudo Compressor",
      },
      {
        imageUrl: laudoEstanqueidadeImageUrl,
        fileName: laudoEstanqueidadeFileName,
        type: "Imagem do Laudo Estanqueidade",
      },
      {
        imageUrl: laudoEletricaImageUrl,
        fileName: laudoEletricaFileName,
        type: "Imagem do Laudo Eletrica",
      },
    ];

    // @ts-ignore
    taskData.images = imagesData.filter((image) => image.imageUrl);

    // @ts-ignore
    const radiusCoords = calculateCoordinatesInRadius(postCoordinates);
    // @ts-ignore
    radiusCoords.push(postCoordinates); // Add the main post coordinate to the array for comparison

    const isWithinRadius = radiusCoords.some(
      (coord) =>
        // @ts-ignore
        Math.abs(coord.lat - coordinates.lat) < 0.0001 &&
        // @ts-ignore
        Math.abs(coord.lng - coordinates.lng) < 0.0001
    );

    console.log(`Supervisor is within radius: ${isWithinRadius}`);

    if (!isWithinRadius) {
      toast.error(
        "Você não está dentro do raio permitido para realizar essa tarefa."
      );
      setIsLoading(false);
      return;
    }

    try {
      await sendMessage(taskData);

      const docRef = await addDoc(collection(db, "SUPERVISORS"), taskData);
      console.log("Tarefa salva com ID: ", docRef.id);

      toast.success("Tarefa salva com sucesso!");
      // @ts-ignore
      router.push(`/supervisors-routine?post=${encodeURIComponent(postName)}`);
    } catch (error) {
      console.error("Erro ao salvar os dados da tarefa: ", error);
      toast.error("Erro ao salvar a medição.");
    } finally {
      setIsLoading(false);
    }
  };

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
    date: any;
    time?: string;
    supervisorName: any;
    userName?: string | null;
    postName: any;
    isANPOk: any;
    isLicencaOperacaoOk: any;
    isAlvaraFuncionamentoOk: any;
    isBombeirosOk: any;
    isBrigadaOk: any;
    isContratoSocialOk: any;
    isEpaeOk: any;
    isLaudoCompressorOk: any;
    isLaudoEstanqueidadeOk: any;
    isLaudoEletricaOk: any;
    observations: any;
    images: any;
    id?: string;
  }) {
    const formattedDate = formatDate(data.date);

    const complianceList = [
      `ANP: ${data.isANPOk === "yes" ? "OK" : "NÃO OK"}`,
      `Licença de Operação: ${
        data.isLicencaOperacaoOk === "yes" ? "OK" : "NÃO OK"
      }`,
      `Alvará de Funcionamento: ${
        data.isAlvaraFuncionamentoOk === "yes" ? "OK" : "NÃO OK"
      }`,
      `Alvará dos Bombeiros: ${data.isBombeirosOk === "yes" ? "OK" : "NÃO OK"}`,
      `Brigada: ${data.isBrigadaOk === "yes" ? "OK" : "NÃO OK"}`,
      `Contrato Social: ${data.isContratoSocialOk === "yes" ? "OK" : "NÃO OK"}`,
      `EPAE: ${data.isEpaeOk === "yes" ? "OK" : "NÃO OK"}`,
      `Laudo Compressor: ${
        data.isLaudoCompressorOk === "yes" ? "OK" : "NÃO OK"
      }`,
      `Laudo Estanqueidade: ${
        data.isLaudoEstanqueidadeOk === "yes" ? "OK" : "NÃO OK"
      }`,
      `Laudo Elétrica: ${data.isLaudoEletricaOk === "yes" ? "OK" : "NÃO OK"}`,
    ].join("\n");

    let imagesDescriptions = await Promise.all(
      data.images.map(async (image: { imageUrl: string; type: any }) => {
        const shortUrl = await shortenUrl(image.imageUrl);
        return `${image.type}: ${shortUrl}`;
      })
    ).then((descriptions) => descriptions.join("\n"));

    const messageBody = `*Documentos*\n\nData: ${formattedDate}\nPosto: ${
      data.postName
    }\nSupervisor: ${
      data.supervisorName
    }\n\n*Conformidade*\n\n${complianceList}\n\n*Imagens*\n\n${imagesDescriptions}\n\nObservações: ${
      data.observations || "Sem observações adicionais"
    }`;

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

    console.log("Mensagem de verificação de documentos enviada com sucesso!");
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
            <p className={styles.BudgetTitle}>Documentos</p>
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
            Informe abaixo as informações dos documentos
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
                  <p className={styles.FieldLabel}>ANP OK?</p>
                  <select
                    id="isOk"
                    className={styles.SelectField}
                    value={isANPOk}
                    onChange={(e) => setIsANPOk(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Imagem do ANP</p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    ref={etanolRef}
                    onChange={(e) =>
                      handleImageChange(
                        e,
                        setEtanolImageUrl,
                        setEtanolFileName,
                        etanolRef
                      )
                    }
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
                  {etanolImageUrl && (
                    <div>
                      <img
                        src={etanolImageUrl}
                        alt="Preview do ANP"
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
              </div>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Licença de Operação OK?</p>
                  <select
                    id="isOk"
                    className={styles.SelectField}
                    value={isLicencaOperacaoOk}
                    onChange={(e) => setIsLicencaOperacaoOk(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>
                    Imagem da Licença de Operação
                  </p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    ref={gcRef}
                    onChange={(e) =>
                      handleImageChange(e, setGcImageUrl, setGcFileName, gcRef)
                    }
                  />
                  <button
                    // @ts-ignore
                    onClick={() => gcRef.current && gcRef.current.click()}
                    className={styles.MidiaField}
                  >
                    Carregue sua foto
                  </button>
                  {gcImageUrl && (
                    <div>
                      <img
                        src={gcImageUrl}
                        alt="Preview da Licença de Operação"
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

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Contrato Social OK?</p>
                  <select
                    id="isOk"
                    className={styles.SelectField}
                    value={isContratoSocialOk}
                    onChange={(e) => setIsContratoSocialoOk(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Imagem do Contrato Social</p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    ref={ContratoSocialRef}
                    onChange={(e) =>
                      handleImageChange(
                        e,
                        setContratoSocialImageUrl,
                        setContratoSocialFileName,
                        ContratoSocialRef
                      )
                    }
                  />
                  <button
                    onClick={() =>
                      ContratoSocialRef.current &&
                      // @ts-ignore
                      ContratoSocialRef.current.click()
                    }
                    className={styles.MidiaField}
                  >
                    Carregue sua foto
                  </button>
                  {contratoSocialImageUrl && (
                    <div>
                      <img
                        src={contratoSocialImageUrl}
                        alt="Preview do Contrato Social"
                        style={{
                          maxWidth: "17.5rem",
                          height: "auto",
                          border: "1px solid #939393",
                          borderRadius: "20px",
                        }}
                      />
                      <p className={styles.fileName}>
                        {contratoSocialFileName}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>
                    Alvará de funcionamento OK?
                  </p>
                  <select
                    id="isOk"
                    className={styles.SelectField}
                    value={isAlvaraFuncionamentoOk}
                    onChange={(e) => setIsAlvaraFuncionamentoOk(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>
                    Imagem do Alvará de funcionamento
                  </p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    ref={AlvaraFuncionamentoRef}
                    onChange={(e) =>
                      handleImageChange(
                        e,
                        setAlvaraFuncionamentoImageUrl,
                        setAlvaraFuncionamentoFileName,
                        AlvaraFuncionamentoRef
                      )
                    }
                  />
                  <button
                    onClick={() =>
                      AlvaraFuncionamentoRef.current &&
                      // @ts-ignore
                      AlvaraFuncionamentoRef.current.click()
                    }
                    className={styles.MidiaField}
                  >
                    Carregue sua foto
                  </button>
                  {alvaraFuncionamentoImageUrl && (
                    <div>
                      <img
                        src={alvaraFuncionamentoImageUrl}
                        alt="Preview do Alvará de funcionamento"
                        style={{
                          maxWidth: "17.5rem",
                          height: "auto",
                          border: "1px solid #939393",
                          borderRadius: "20px",
                        }}
                      />
                      <p className={styles.fileName}>
                        {alvaraFuncionamentoFileName}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Bombeiros OK?</p>
                  <select
                    id="isOk"
                    className={styles.SelectField}
                    value={isBombeirosOk}
                    onChange={(e) => setIsBombeirosOk(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Imagem dos Bombeiros</p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    ref={BombeirosRef}
                    onChange={(e) =>
                      handleImageChange(
                        e,
                        setBombeirosImageUrl,
                        setBombeirosFileName,
                        BombeirosRef
                      )
                    }
                  />
                  <button
                    onClick={() =>
                      // @ts-ignore
                      BombeirosRef.current && BombeirosRef.current.click()
                    }
                    className={styles.MidiaField}
                  >
                    Carregue sua foto
                  </button>
                  {bombeirosImageUrl && (
                    <div>
                      <img
                        src={bombeirosImageUrl}
                        alt="Preview dos Bombeiros"
                        style={{
                          maxWidth: "17.5rem",
                          height: "auto",
                          border: "1px solid #939393",
                          borderRadius: "20px",
                        }}
                      />
                      <p className={styles.fileName}>{bombeirosFileName}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>EPAE OK?</p>
                  <select
                    id="isOk"
                    className={styles.SelectField}
                    value={isEpaeOk}
                    onChange={(e) => setIsEpaeOk(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Imagem do EPAE</p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    ref={EpaeRef}
                    onChange={(e) =>
                      handleImageChange(
                        e,
                        setEpaeImageUrl,
                        setEpaeFileName,
                        EpaeRef
                      )
                    }
                  />
                  <button
                    // @ts-ignore
                    onClick={() => EpaeRef.current && EpaeRef.current.click()}
                    className={styles.MidiaField}
                  >
                    Carregue sua foto
                  </button>
                  {epaeImageUrl && (
                    <div>
                      <img
                        src={epaeImageUrl}
                        alt="Preview do EPAE"
                        style={{
                          maxWidth: "17.5rem",
                          height: "auto",
                          border: "1px solid #939393",
                          borderRadius: "20px",
                        }}
                      />
                      <p className={styles.fileName}>{epaeFileName}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Brigada OK?</p>
                  <select
                    id="isOk"
                    className={styles.SelectField}
                    value={isBrigadaOk}
                    onChange={(e) => setIsBrigadaOk(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Imagem da Brigada</p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    ref={BrigadaRef}
                    onChange={(e) =>
                      handleImageChange(
                        e,
                        setBrigadaImageUrl,
                        setBrigadaFileName,
                        BrigadaRef
                      )
                    }
                  />
                  <button
                    onClick={() =>
                      // @ts-ignore
                      BrigadaRef.current && BrigadaRef.current.click()
                    }
                    className={styles.MidiaField}
                  >
                    Carregue sua foto
                  </button>
                  {brigadaImageUrl && (
                    <div>
                      <img
                        src={brigadaImageUrl}
                        alt="Preview da Brigada"
                        style={{
                          maxWidth: "17.5rem",
                          height: "auto",
                          border: "1px solid #939393",
                          borderRadius: "20px",
                        }}
                      />
                      <p className={styles.fileName}>{brigadaFileName}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Laudo Compressor OK?</p>
                  <select
                    id="isOk"
                    className={styles.SelectField}
                    value={isLaudoCompressorOk}
                    onChange={(e) => setIsLaudoCompressorOk(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>
                    Imagem do Laudo Compressor
                  </p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    ref={LaudoCompressorRef}
                    onChange={(e) =>
                      handleImageChange(
                        e,
                        setLaudoCompressorImageUrl,
                        setLaudoCompressorFileName,
                        LaudoCompressorRef
                      )
                    }
                  />
                  <button
                    onClick={() =>
                      LaudoCompressorRef.current &&
                      // @ts-ignore
                      LaudoCompressorRef.current.click()
                    }
                    className={styles.MidiaField}
                  >
                    Carregue sua foto
                  </button>
                  {laudoCompressorImageUrl && (
                    <div>
                      <img
                        src={laudoCompressorImageUrl}
                        alt="Preview do Laudo Compressor"
                        style={{
                          maxWidth: "17.5rem",
                          height: "auto",
                          border: "1px solid #939393",
                          borderRadius: "20px",
                        }}
                      />
                      <p className={styles.fileName}>
                        {laudoCompressorFileName}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Laudo Estanqueidade OK?</p>
                  <select
                    id="isOk"
                    className={styles.SelectField}
                    value={isLaudoEstanqueidadeOk}
                    onChange={(e) => setIsLaudoEstanqueidadeOk(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>
                    Imagem do Laudo Estanqueidade
                  </p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    ref={LaudoEstanqueidadeRef}
                    onChange={(e) =>
                      handleImageChange(
                        e,
                        setLaudoEstanqueidadeImageUrl,
                        setLaudoEstanqueidadeFileName,
                        LaudoEstanqueidadeRef
                      )
                    }
                  />
                  <button
                    onClick={() =>
                      LaudoEstanqueidadeRef.current &&
                      // @ts-ignore
                      LaudoEstanqueidadeRef.current.click()
                    }
                    className={styles.MidiaField}
                  >
                    Carregue sua foto
                  </button>
                  {laudoEstanqueidadeImageUrl && (
                    <div>
                      <img
                        src={laudoEstanqueidadeImageUrl}
                        alt="Preview do Laudo Estanqueidade"
                        style={{
                          maxWidth: "17.5rem",
                          height: "auto",
                          border: "1px solid #939393",
                          borderRadius: "20px",
                        }}
                      />
                      <p className={styles.fileName}>
                        {laudoEstanqueidadeFileName}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>
                    Laudo Elétrica e Para Raio OK?
                  </p>
                  <select
                    id="isOk"
                    className={styles.SelectField}
                    value={isLaudoEletricaOk}
                    onChange={(e) => setIsLaudoEletricaOk(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>
                    Imagem do Laudo Elétrica e Para Raio
                  </p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    ref={LaudoEletricaRef}
                    onChange={(e) =>
                      handleImageChange(
                        e,
                        setLaudoEletricaImageUrl,
                        setLaudoEletricaFileName,
                        LaudoEletricaRef
                      )
                    }
                  />
                  <button
                    onClick={() =>
                      LaudoEletricaRef.current &&
                      // @ts-ignore
                      LaudoEletricaRef.current.click()
                    }
                    className={styles.MidiaField}
                  >
                    Carregue sua foto
                  </button>
                  {laudoEletricaImageUrl && (
                    <div>
                      <img
                        src={laudoEletricaImageUrl}
                        alt="Preview do Laudo Elétrica e Para Raio"
                        style={{
                          maxWidth: "17.5rem",
                          height: "auto",
                          border: "1px solid #939393",
                          borderRadius: "20px",
                        }}
                      />
                      <p className={styles.fileName}>{laudoEletricaFileName}</p>
                    </div>
                  )}
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
                          <p className={styles.FieldLabel}>{image.type}</p>
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

              <div className={styles.InputContainer}>
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
