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
import { ChangeEvent, useEffect, useState } from "react";
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

export default function NewPost() {
  const router = useRouter();
  const postName = router.query.postName;
  const docId = router.query.docId;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [observations, setObservations] = useState("");

  const [pumps, setPumps] = useState([]);
  const [pumpUrls, setPumpUrls] = useState([]); // Array para armazenar URLs das imagens no storage

  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [postCoordinates, setPostCoordinates] = useState({
    lat: null,
    lng: null,
  });
  const [mapUrl, setMapUrl] = useState("");
  const [radiusCoordinates, setRadiusCoordinates] = useState([]);

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
  }, [date, time, observations]);

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

  useEffect(() => {
    if (docId) {
      const fetchData = async () => {
        setIsLoading(true);
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
    }
  }, [docId]);

  useEffect(() => {
    if (postName) {
      const fetchPostDetails = async () => {
        try {
          const postsRef = collection(db, "POSTS");
          const q = query(postsRef, where("name", "==", postName));
          const querySnapshot = await getDocs(q);

          querySnapshot.forEach((doc) => {
            const postData = doc.data();
            const numPumps = postData.bombs.length;
            setPumps(
              // @ts-ignore
              Array(numPumps).fill({ image1Url: "", image2Url: "", ok: "" })
            );
            //@ts-ignore
            setPumpUrls(Array(numPumps).fill({ image1Url: "", image2Url: "" }));
          });
        } catch (error) {
          console.error("Error fetching post details:", error);
        }
      };
      fetchPostDetails();
    }
  }, [postName]);

  const handleFileChange = async (
    pumpIndex: number,
    imageKey: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setIsLoading(true);
    // @ts-ignore
    const file = event.target.files[0];
    if (file) {
      const isImage = file.type.startsWith("image/");
      const uploadFile = isImage ? await compressImage(file) : file;
      const path = `supervisors/${date}/${file.name}_${Date.now()}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, uploadFile);
      const fileUrl = await getDownloadURL(storageRef);

      const updatedPumps = [...pumps];
      // @ts-ignore
      updatedPumps[pumpIndex] = {
        // @ts-ignore
        ...updatedPumps[pumpIndex],
        [`${imageKey}Url`]: fileUrl,
      };
      setPumps(updatedPumps);

      const updatedPumpUrls = [...pumpUrls];
      // @ts-ignore
      updatedPumpUrls[pumpIndex] = {
        // @ts-ignore
        ...updatedPumpUrls[pumpIndex],
        [`${imageKey}Url`]: fileUrl,
      };
      setPumpUrls(updatedPumpUrls);
    }
    setIsLoading(false);
  };

  const handleSelectChange = (pumpIndex: number, value: string) => {
    const newPumps = [...pumps];
    // @ts-ignore
    newPumps[pumpIndex] = { ...newPumps[pumpIndex], ok: value };
    setPumps(newPumps);
  };

  const getLocalISODate = () => {
    const date = new Date();
    date.setHours(date.getHours() - 3); // Ajustar para o fuso horário -03:00
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

    for (let pump of pumps) {
      // @ts-ignore
      if (!pump.ok) {
        missingField = "Todos os campos 'OK?' devem ser preenchidos";
        break;
      }
      // @ts-ignore
      if (!pump.image1Url && !pump.image2Url) {
        missingField = "Cada bomba deve ter pelo menos uma imagem";
        break;
      }
    }

    if (missingField) {
      toast.error(missingField);
      setIsLoading(false);
      return;
    }

    const userName = localStorage.getItem("userName");
    const managersRef = collection(db, "SUPERVISORS");
    const q = query(
      managersRef,
      where("date", "==", date),
      where("id", "==", "identificacao-fornecedor"),
      where("userName", "==", userName),
      where("postName", "==", postName)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      toast.error("A tarefa identificação de fornecedor já foi feita hoje!");
      setIsLoading(false);
      return;
    }

    const taskData = {
      date,
      time,
      supervisorName: userName,
      userName,
      postName,
      observations,
      coordinates,

      pumps: pumpUrls,
      id: "identificacao-fornecedor",
    };

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
      await addDoc(collection(db, "SUPERVISORS"), taskData);
      toast.success("Tarefa salva com sucesso!");
      // @ts-ignore
      router.push(`/supervisors-routine?post=${encodeURIComponent(postName)}`);
    } catch (error) {
      console.error("Erro ao salvar os dados da tarefa: ", error);
      toast.error("Erro ao salvar a medição.");
      setIsLoading(false);
    }
  };

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
    pumps: any[];
    time: any;
    postName: any;
    supervisorName: any;
    observations: any;
  }) {
    const formattedDate = formatDate(data.date);

    let pumpDescriptions = await Promise.all(
      data.pumps.map(async (pump, index) => {
        const status = pump.ok === "yes" ? "OK" : "NÃO OK";
        const imageInfo1 = pump.image1Url
          ? `*Imagem 1:* ${await shortenUrl(pump.image1Url)}`
          : "*Sem imagem 1*";
        const imageInfo2 = pump.image2Url
          ? `*Imagem 2:* ${await shortenUrl(pump.image2Url)}`
          : "*Sem imagem 2*";
        return `*Bomba ${
          index + 1
        }:* ${status}\n${imageInfo1}\n${imageInfo2}\n`;
      })
    ).then((descriptions) => descriptions.join("\n"));

    const messageBody = `*Identificação do fornecedor*\n\n*Data:* ${formattedDate}\n*Hora:* ${
      data.time
    }\n*Posto:* ${data.postName}\n*Supervisor:* ${
      data.supervisorName
    }\n\n*Detalhes das Bombas*\n\n${pumpDescriptions}\n\n${
      data.observations
        ? `*Observações:* ${data.observations}`
        : "_*Sem observações adicionais*_"
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

    console.log("Mensagem de limpeza das bombas enviada com sucesso!");
  }

  function formatDate(dateString: string | number | Date) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1); // Adicionando um dia
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().substr(-2);
    return `${day}/${month}/${year}`;
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
            <p className={styles.BudgetTitle}>Identificação de fornecedor</p>
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
            Informe abaixo as informações da identificação de fornecedor
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

              {docId &&
                data &&
                // @ts-ignore
                data.pumps &&
                // @ts-ignore
                data.pumps.map((pump, index) => (
                  <div key={index} className={styles.InputContainer}>
                    {[1, 2].map((imageIndex) => (
                      <div key={imageIndex} className={styles.InputField}>
                        <p className={styles.FieldLabel}>
                          Imagem {imageIndex} da Bomba {index + 1}
                        </p>
                        {pump && pump[`image${imageIndex}`] && (
                          <img
                            src={pump[`image${imageIndex}`].url}
                            alt={`Imagem ${imageIndex} da Bomba ${index + 1}`}
                            style={{
                              maxWidth: "11.5rem",
                              height: "auto",
                              border: "1px solid #939393",
                              borderRadius: "20px",
                            }}
                          />
                        )}
                      </div>
                    ))}
                    <div className={styles.InputField}>
                      <p className={styles.FieldLabel}>OK?</p>
                      <select
                        className={styles.SelectField}
                        value={pump && pump.ok ? pump.ok : ""}
                        onChange={(e) =>
                          handleSelectChange(index, e.target.value)
                        }
                      >
                        <option value="">Selecione</option>
                        <option value="yes">Sim</option>
                        <option value="no">Não</option>
                      </select>
                    </div>
                  </div>
                ))}

              {pumps.map((pump, index) => (
                <div key={index} className={styles.InputContainer}>
                  {["image1", "image2"].map((imageKey, idx) => (
                    <div key={idx} className={styles.InputField}>
                      <p className={styles.FieldLabel}>
                        Imagem {idx + 1} da Bomba {index + 1}
                      </p>
                      <input
                        id={`file-input-${index}-${idx}`}
                        type="file"
                        accept="image/*,video/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileChange(index, imageKey, e)}
                      />
                      <button
                        onClick={() =>
                          // @ts-ignore
                          document
                            .getElementById(`file-input-${index}-${idx}`)
                            .click()
                        }
                        className={styles.MidiaField}
                      >
                        Carregue a Imagem {idx + 1}
                      </button>
                      {pump[`${imageKey}Url`] && (
                        <img
                          src={pump[`${imageKey}Url`]}
                          alt={`Preview da Imagem ${idx + 1} da Bomba ${
                            index + 1
                          }`}
                          style={{
                            maxWidth: "11.5rem",
                            height: "auto",
                            border: "1px solid #939393",
                            borderRadius: "20px",
                          }}
                        />
                      )}
                    </div>
                  ))}
                  <div className={styles.InputField}>
                    <p className={styles.FieldLabel}>OK?</p>
                    <select
                      className={styles.SelectField}
                      // @ts-ignore
                      value={pump.ok}
                      onChange={(e) =>
                        handleSelectChange(index, e.target.value)
                      }
                    >
                      <option value="">Selecione</option>
                      <option value="yes">Sim</option>
                      <option value="no">Não</option>
                    </select>
                  </div>
                </div>
              ))}
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
