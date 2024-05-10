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
import { useEffect, useState } from "react";
import { db, getDownloadURL, ref, storage } from "../../../firebase";

import LoadingOverlay from "@/components/Loading";
import { uploadBytes } from "firebase/storage";

export default function NewPost() {
  const router = useRouter();
  const postName = router.query.postName;

  const docId = router.query.docId;
  const [data, setData] = useState(null);

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
          setUseMachinesTurn1(fetchedData.qtdTurn1);
          setUseMachinesTurn2(fetchedData.qtdTurn2);
          setUseMachinesTurn3(fetchedData.qtdTurn3);
          setUseMachinesIntermediate(fetchedData.qtdIntermediate);

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

  const [useMachinesTurn1, setUseMachinesTurn1] = useState("");
  const [useMachinesTurn2, setUseMachinesTurn2] = useState("");
  const [useMachinesTurn3, setUseMachinesTurn3] = useState("");
  const [useMachinesIntermediate, setUseMachinesIntermediate] = useState("");

  const [observations, setObservations] = useState("");

  const saveMeasurement = async () => {
    setIsLoading(true);

    let missingField = "";
    const today = new Date().toISOString().slice(0, 10);

    if (!date) missingField = "Data";
    else if (date !== today) {
      toast.error("Você deve cadastrar a data correta de hoje!");
      setIsLoading(false);

      return;
    } else if (!time) missingField = "Hora";
    // else if (!managerName) missingField = "Nome do supervisor";
    else if (!useMachinesTurn1) missingField = "Quantidade turno 1";
    else if (!useMachinesTurn2) missingField = "Quantidade turno 2";
    else if (!useMachinesTurn3) missingField = "Quantidade turno 3";
    else if (!useMachinesIntermediate)
      missingField = "Quantidade Intermediário";

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
      where("id", "==", "escala-trabalho"),
      where("userName", "==", userName),
      where("postName", "==", postName)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      toast.error("A tarefa escala de trabalho já foi feita hoje!");
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
      qtdTurn1: useMachinesTurn1,
      qtdTurn2: useMachinesTurn2,
      qtdTurn3: useMachinesTurn3,
      qtdIntermediate: useMachinesIntermediate,
      id: "escala-trabalho",
    };

    try {
      const docRef = await addDoc(collection(db, "SUPERVISORS"), taskData);
      console.log("Tarefa salva com ID: ", docRef.id);

      sendMessage(taskData);

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

  async function sendMessage(data: {
    date: string | number | Date;
    time: any;
    postName: any;
    supervisorName: any;
    qtdTurn1: any;
    qtdTurn2: any;
    qtdTurn3: any;
    qtdIntermediate: any;
    observations: any;
  }) {
    const formattedDate = formatDate(data.date); // Assumindo uma função de formatação de data existente

    // Montar o corpo da mensagem
    const messageBody = `*Escala de Trabalho
    *\n\nData: ${formattedDate}\nPosto: ${data.postName}\nSupervisor: ${
      data.supervisorName
    }\n\n*Detalhes dos turnos*\n\nTurno 1: ${data.qtdTurn1}\nTurno 2: ${
      data.qtdTurn2
    }\nTurno 3: ${data.qtdTurn3}\nIntermediário: ${
      data.qtdIntermediate
    }\n\nObservações: ${data.observations || "Sem observações adicionais"}`;

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

    console.log("Mensagem de escala de trabalho enviada com sucesso!");
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
            <p className={styles.BudgetTitle}>Escala de trabalho</p>
            <div className={styles.BudgetHeadS}>
              {!docId && (
                <button
                  className={styles.FinishButton}
                  onClick={saveMeasurement}
                >
                  <img
                    src="./finishBudget.png"
                    alt="Finalizar"
                    className={styles.buttonImage}
                  />
                  <span className={styles.buttonText}>Cadastrar tarefa</span>
                </button>
              )}
            </div>
          </div>

          <p className={styles.Notes}>
            Informe abaixo as informações da escala de trabalho
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
              {/* <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Nome do supervisor</p>
                  <input
                    id="driverName"
                    type="text"
                    className={styles.Field}
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder=""
                  />
                </div>
              </div> */}
              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Turno 1</p>
                  <input
                    id="useMachinesTurn1"
                    type="number"
                    className={styles.Field}
                    value={useMachinesTurn1}
                    onChange={(e) => setUseMachinesTurn1(e.target.value)}
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Turno 2</p>
                  <input
                    id="useMachinesTurn2"
                    type="number"
                    className={styles.Field}
                    value={useMachinesTurn2}
                    onChange={(e) => setUseMachinesTurn2(e.target.value)}
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Turno 3</p>
                  <input
                    id="useMachinesTurn3"
                    type="number"
                    className={styles.Field}
                    value={useMachinesTurn3}
                    onChange={(e) => setUseMachinesTurn3(e.target.value)}
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Intermediário</p>
                  <input
                    id="useMachinesIntermediate"
                    type="number"
                    className={styles.Field}
                    value={useMachinesIntermediate}
                    onChange={(e) => setUseMachinesIntermediate(e.target.value)}
                  />
                </div>
              </div>
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