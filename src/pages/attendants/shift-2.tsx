import Head from "next/head";
import { useRouter } from "next/router";
import styles from "../../styles/ProductFoam.module.scss";

import HeaderNewProduct from "@/components/HeaderNewTask";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
import { createRef, useEffect, useRef, useState } from "react";
import { db, getDownloadURL, ref, storage } from "../../../firebase";

import LoadingOverlay from "@/components/Loading";
import { uploadBytes } from "firebase/storage";

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
        const docRef = doc(db, "ATTENDANTS", docId as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetchedData = docSnap.data();
          // @ts-ignore
          setData(fetchedData);

          setDate(fetchedData.date);
          setTime(fetchedData.time);
          setAttendant(fetchedData.attendant);
          setEtPrice(fetchedData.etPrice);
          setGcPrice(fetchedData.gcPrice);
          setGaPrice(fetchedData.gaPrice);
          setS10Price(fetchedData.s10Price);
          setEtSales(fetchedData.etSales);
          setGcSales(fetchedData.gcSales);
          setGaSales(fetchedData.gaSales);
          setS10Sales(fetchedData.s10Sales);
          setTotalLiters(fetchedData.totalLiters);
          setCash(fetchedData.cash);
          setDebit(fetchedData.debit);
          setCredit(fetchedData.credit);
          setPix(fetchedData.pix);
          setTotalOutput(fetchedData.totalOutput);
          setTotalInput(fetchedData.totalInput);
          setDifference(fetchedData.difference);
          setObservations(fetchedData.observations);
          setExpenses(fetchedData.expenses);
          setMediaUrl(fetchedData.mediaUrl);

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
  const [attendant, setAttendant] = useState("");
  const [managerName, setManagerName] = useState("");

  const [isOk, setIsOk] = useState("");
  const [observations, setObservations] = useState("");

  // States para preços
  const [etPrice, setEtPrice] = useState("");
  const [gcPrice, setGcPrice] = useState("");
  const [gaPrice, setGaPrice] = useState("");
  const [s10Price, setS10Price] = useState("");

  // States para vendas de combustíveis
  const [etSales, setEtSales] = useState("");
  const [gcSales, setGcSales] = useState("");
  const [gaSales, setGaSales] = useState("");
  const [s10Sales, setS10Sales] = useState("");
  const [totalLiters, setTotalLiters] = useState("");

  // States para movimento
  const [cash, setCash] = useState("");
  const [debit, setDebit] = useState("");
  const [credit, setCredit] = useState("");
  const [pix, setPix] = useState("");

  // States para total de entrada e saída
  const [totalOutput, setTotalOutput] = useState(0);
  const [totalInput, setTotalInput] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [difference, setDifference] = useState(0);

  const [expenses, setExpenses] = useState([
    { expenseValue: "", expenseType: "" }, // Estado inicial com um item, se necessário
  ]);

  const [numMaquininhas, setNumMaquininhas] = useState(0);
  const [maquininhasImages, setMaquininhasImages] = useState<File[][]>([
    // @ts-ignore
    [null, null], // Inicializamos com os campos para as duas imagens fixas
  ]);
  const [maquininhasFileNames, setMaquininhasFileNames] = useState<string[][]>([
    ["", ""], // Inicializamos com os campos para as duas imagens fixas
  ]);
  const maquininhasRefs = useRef([createRef(), createRef()]);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const mediaRef = useRef<HTMLInputElement>(null);
  const [mediaFileName, setMediaFileName] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

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

  const handleNumMaquininhasChange = (event: { target: { value: string } }) => {
    const value = parseInt(event.target.value, 10);
    setNumMaquininhas(isNaN(value) ? 0 : value);

    // @ts-ignore
    setMaquininhasImages((prev) => [
      prev[0] || [null, null], // Manter as imagens fixas já existentes ou inicializar
      ...Array.from({ length: isNaN(value) ? 0 : value }, () => [null]),
    ]);

    setMaquininhasFileNames((prev) => [
      prev[0] || ["", ""], // Manter os nomes de arquivos fixos já existentes ou inicializar
      ...Array.from({ length: isNaN(value) ? 0 : value }, () => [""]),
    ]);

    maquininhasRefs.current = [
      maquininhasRefs.current[0] || createRef(),
      maquininhasRefs.current[1] || createRef(),
      ...Array.from({ length: isNaN(value) ? 0 : value }, () => createRef()),
    ];
  };

  const handleImageChange =
    (maquininhaIndex: number, imageIndex: number) =>
    async (event: { target: { files: any[] } }) => {
      const file = event.target.files[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          console.error("O arquivo fornecido não é uma imagem");
          toast.error("Por favor, selecione um arquivo de imagem.");
          return;
        }

        setIsLoading(true);
        try {
          const compressedFile = await compressImage(file);
          const imageUrl = await uploadImageAndGetUrl(
            compressedFile,
            `attendants/${getLocalISODate()}/${
              compressedFile.name
            }_${Date.now()}`
          );

          if (imageIndex < 2) {
            // Para Filipeta Sistema Frente e Verso, use sempre os índices 0 e 1
            setMaquininhasImages((prev) => {
              const newImages = [...prev];
              // @ts-ignore
              newImages[0][imageIndex] = imageUrl;
              return newImages;
            });
            setMaquininhasFileNames((prev) => {
              const newFileNames = [...prev];
              newFileNames[0][imageIndex] = compressedFile.name;
              return newFileNames;
            });
          } else {
            // Para Filipeta Maquininha, use o índice da maquininha atual mais 2
            setMaquininhasImages((prev) => {
              const newImages = [...prev];
              // @ts-ignore
              newImages[maquininhaIndex + 1][0] = imageUrl;
              return newImages;
            });
            setMaquininhasFileNames((prev) => {
              const newFileNames = [...prev];
              newFileNames[maquininhaIndex + 1][0] = compressedFile.name;
              return newFileNames;
            });
          }
        } catch (error) {
          console.error("Erro ao fazer upload da imagem:", error);
          toast.error("Erro ao fazer upload da imagem.");
        } finally {
          setIsLoading(false);
        }
      }
    };

  const handleInputChange =
    (setter: (arg0: any) => void) => (e: { target: { value: string } }) => {
      const value = e.target.value.replace(",", ".");
      setter(value);
    };

  const handleExpenseChange = (index: number, field: string, value: string) => {
    const newExpenses = expenses.map((expense, i) =>
      i === index ? { ...expense, [field]: value.replace(",", ".") } : expense
    );
    setExpenses(newExpenses);
  };

  const addExpense = () => {
    setExpenses([...expenses, { expenseValue: "", expenseType: "" }]);
  };

  const removeExpense = (index: number) => {
    const newExpenses = [...expenses];
    newExpenses.splice(index, 1);
    setExpenses(newExpenses);
  };

  const handleMediaChange = async (event: { target: { files: any[] } }) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        console.error("O arquivo fornecido não é uma imagem ou vídeo");
        toast.error("Por favor, selecione um arquivo de imagem ou vídeo.");
        return;
      }

      setIsLoading(true);
      try {
        const compressedFile = await compressImage(file);
        const mediaUrl = await uploadImageAndGetUrl(
          compressedFile,
          `attendants/${getLocalISODate()}/${compressedFile.name}_${Date.now()}`
        );
        setMediaFile(compressedFile);
        setMediaFileName(compressedFile.name);
        setMediaUrl(mediaUrl);
      } catch (error) {
        console.error("Erro ao fazer upload da mídia:", error);
        toast.error("Erro ao fazer upload da mídia.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const total =
      Number(gcPrice) * Number(gcSales) +
      Number(etPrice) * Number(etSales) +
      Number(gaPrice) * Number(gaSales) +
      Number(s10Price) * Number(s10Sales);

    setTotalLiters(
      // @ts-ignore
      Number(gcSales) + Number(etSales) + Number(gaSales) + Number(s10Sales)
    );
    // @ts-ignore
    setTotalOutput(total);
  }, [
    gcPrice,
    gcSales,
    etPrice,
    etSales,
    gaPrice,
    gaSales,
    s10Price,
    s10Sales,
  ]);

  useEffect(() => {
    const totalPayments =
      Number(cash) + Number(debit) + Number(credit) + Number(pix);

    const totalExpenses = expenses.reduce((acc, current) => {
      return acc + Number(current.expenseValue);
    }, 0);

    const total = totalPayments;

    // @ts-ignore
    setTotalInput(total);
  }, [cash, debit, credit, pix, expenses]);

  useEffect(() => {
    const totalExpenses = expenses.reduce((acc, current) => {
      return acc + Number(current.expenseValue);
    }, 0);

    const total = totalExpenses;

    // @ts-ignore
    setTotalExpenses(total);
  }, [expenses]);

  useEffect(() => {
    let total = 0;

    // @ts-ignore
    total = totalInput + totalExpenses - totalOutput;

    // @ts-ignore
    setDifference(total);
  }, [totalInput, totalOutput, totalExpenses]);

  const getLocalISODate = () => {
    const date = new Date();
    // Ajustar para o fuso horário -03:00
    date.setHours(date.getHours() - 3);
    return date.toISOString().slice(0, 10);
  };

  const saveMeasurement = async () => {
    setIsLoading(true);

    let missingField = "";
    const today = getLocalISODate();
    console.log(today);

    // Verificação de campos NaN
    const fields = [
      etPrice,
      gcPrice,
      gaPrice,
      s10Price,
      etSales,
      gcSales,
      gaSales,
      s10Sales,
      totalLiters,
      cash,
      debit,
      credit,
      pix,
      totalOutput,
      totalInput,
      difference,
      ...expenses.map((expense) => expense.expenseValue),
    ];

    const hasNaN = fields.some((field) => isNaN(Number(field)));

    if (hasNaN) {
      toast.error("Por favor, preencha todos os campos corretamente.");
      setIsLoading(false);
      return;
    }

    if (!date) missingField = "Data";
    else if (date !== today) {
      toast.error("Você deve cadastrar a data correta de hoje!");
      setIsLoading(false);
      return;
    } else if (!time) missingField = "Hora";

    if (missingField) {
      toast.error(`Por favor, preencha o campo obrigatório: ${missingField}.`);
      setIsLoading(false);
      return;
    }

    const userName = localStorage.getItem("userName");

    const managersRef = collection(db, "ATTENDANTS");
    const q = query(
      managersRef,
      where("date", "==", date),
      where("id", "==", "turno-2"),
      where("userName", "==", userName),
      where("postName", "==", postName)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      toast.error("O relatório de turno 2 já foi feito hoje!");
      setIsLoading(false);
      return;
    }

    const images = maquininhasImages.flatMap((imageFiles) =>
      imageFiles.filter((image) => image !== null)
    );

    console.log(images);

    const taskData = {
      date,
      time,
      attendant,
      postName,
      shift: "02",
      etPrice,
      gcPrice,
      gaPrice,
      s10Price,
      etSales,
      gcSales,
      gaSales,
      s10Sales,
      totalLiters,
      cash,
      debit,
      credit,
      pix,
      totalOutput,
      totalExpenses,
      totalInput,
      difference,
      observations,
      expenses,
      images,
      mediaUrl,
      id: "turno-2",
    };

    try {
      // @ts-ignore
      await sendMessage(taskData);

      const docRef = await addDoc(collection(db, "ATTENDANTS"), taskData);
      console.log("Tarefa salva com ID: ", docRef.id);
      toast.success("Tarefa salva com sucesso!");

      // @ts-ignore
      router.push(`/attendants?post=${encodeURIComponent(postName)}`);
    } catch (error) {
      console.error("Erro ao salvar os dados da tarefa: ", error);
      toast.error("Erro ao salvar a medição.");
    } finally {
      setIsLoading(false);
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
    time: any;
    postName: any;
    attendant: any;
    etPrice: any;
    etSales: any;
    gcPrice: any;
    gcSales: any;
    gaPrice: any;
    gaSales: any;
    s10Price: any;
    s10Sales: any;
    totalLiters: any;
    cash: any;
    debit: any;
    credit: any;
    pix: any;
    totalInput: any;
    totalExpenses: any;
    totalOutput: any;
    difference: any;
    observations: any;
    expenses: any;
    images: string[];
    mediaUrl: string;
  }) {
    const formattedDate = formatDate(data.date);
    const formattedExpenses = data.expenses
      .map(
        (exp: { expenseType: any; expenseValue: any }) =>
          `*Tipo:* ${exp.expenseType}, *Valor:* R$ ${exp.expenseValue}`
      )
      .join("\n");

    const imagesDescription = await Promise.all(
      data.images.map(async (imageUrl, index) => {
        if (!imageUrl) {
          return "";
        }
        const shortUrl = await shortenUrl(imageUrl);
        if (index === 0) {
          return `*Filipeta Sistema Frente:* ${shortUrl}\n`;
        } else if (index === 1) {
          return `*Filipeta Sistema Verso:* ${shortUrl}\n`;
        } else {
          const maquininhaIndex = index - 1;
          return `*Filipeta Maquininha ${maquininhaIndex}:* ${shortUrl}\n`;
        }
      })
    ).then((descriptions) => descriptions.filter(Boolean).join("\n")); // Remove strings vazias

    const mediaDescription = data.mediaUrl
      ? `*Comprovante de aferição:* ${await shortenUrl(data.mediaUrl)}\n`
      : "";

    const messageBody = `*Novo Relatório de Turno 02:*\n\n*Data:* ${formattedDate}\n*Hora:* ${
      data.time
    }\n*Posto:* ${data.postName}\n*Responsável:* ${
      data.attendant
    }\n\n*Vendas*\n*ET:* R$ ${(
      Number(data.etPrice) * Number(data.etSales)
    ).toFixed(2)} (*${Number(data.etSales).toFixed(3)} litros*)\n*GC:* R$ ${(
      Number(data.gcPrice) * Number(data.gcSales)
    ).toFixed(2)} (*${Number(data.gcSales).toFixed(3)} litros*)\n*GA:* R$ ${(
      Number(data.gaPrice) * Number(data.gaSales)
    ).toFixed(2)} (*${Number(data.gaSales).toFixed(3)} litros*)\n*S10:* R$ ${(
      Number(data.s10Price) * Number(data.s10Sales)
    ).toFixed(2)} (*${Number(data.s10Sales).toFixed(
      3
    )} litros*)\n\n*Totais*\n*Litros Vendidos:* ${data.totalLiters.toFixed(
      3
    )}\n*Dinheiro:* R$ ${Number(data.cash).toFixed(2)}\n*Débito:* R$ ${Number(
      data.debit
    ).toFixed(2)}\n*Crédito:* R$ ${Number(data.credit).toFixed(
      2
    )}\n*Pix:* R$ ${Number(data.pix).toFixed(
      2
    )}\n*Total de Despesas:* R$ ${Number(data.totalExpenses).toFixed(
      2
    )}\n*Total de Entradas:* R$ ${Number(data.totalInput).toFixed(
      2
    )}\n*Total de Saídas:* R$ ${Number(data.totalOutput).toFixed(
      2
    )}\n*Diferença:* R$ ${Number(data.difference).toFixed(
      2
    )}\n\n*Despesas*\n${formattedExpenses}\n\n*Observações:* ${
      data.observations
    }\n\n*Imagens da tarefa*\n\n${imagesDescription}\n${mediaDescription}`;

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

    console.log("Mensagem enviada com sucesso!");
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
            <p className={styles.BudgetTitle}>Relatório de turno 02</p>
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
                  <span className={styles.buttonText}>Cadastrar relatório</span>
                </button>
              )}
            </div>
          </div>

          <p className={styles.Notes}>
            Informe abaixo as informações do relatório
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
                  <p className={styles.FieldLabel}>Nome do operador</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={attendant}
                    onChange={(e) => setAttendant(e.target.value)}
                    placeholder=""
                  />
                </div>
              </div>

              <p className={styles.BudgetTitle}>Maquininhas</p>
              <p className={styles.Notes}>
                Informe abaixo as informações das maquininhas
              </p>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Número de maquininhas</p>
                  <input
                    type="number"
                    className={styles.Field}
                    value={numMaquininhas}
                    onChange={handleNumMaquininhasChange}
                    placeholder=""
                  />
                </div>
              </div>
              <div className={styles.InputField}>
                <div className={styles.InputContainer}>
                  {["Filipeta Sistema Frente", "Filipeta Sistema Verso"].map(
                    (label, imageIndex) => (
                      <div key={imageIndex} className={styles.InputField}>
                        <p className={styles.FieldLabel}>{label}</p>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          style={{ display: "none" }}
                          ref={(el) => {
                            // @ts-ignore
                            maquininhasRefs.current[imageIndex] = el;
                          }}
                          // @ts-ignore
                          onChange={handleImageChange(0, imageIndex)}
                        />
                        <button
                          onClick={() =>
                            // @ts-ignore

                            maquininhasRefs.current[imageIndex]?.click()
                          }
                          className={styles.MidiaField}
                        >
                          Carregue sua foto
                        </button>
                        {maquininhasImages[0] &&
                          maquininhasImages[0][imageIndex] && (
                            <div>
                              <img
                                // @ts-ignore
                                src={maquininhasImages[0][imageIndex]}
                                alt={`Preview da ${label}`}
                                style={{
                                  maxWidth: "17.5rem",
                                  height: "auto",
                                  border: "1px solid #939393",
                                  borderRadius: "20px",
                                }}
                                onLoad={() =>
                                  URL.revokeObjectURL(
                                    // @ts-ignore

                                    maquininhasImages[0][imageIndex]
                                  )
                                }
                              />
                              <p className={styles.fileName}>
                                {maquininhasFileNames[0][imageIndex]}
                              </p>
                            </div>
                          )}
                      </div>
                    )
                  )}
                </div>
                {Array.from(
                  { length: numMaquininhas },
                  (_, maquininhaIndex) => (
                    <div
                      key={maquininhaIndex}
                      className={styles.InputContainer}
                    >
                      <p className={styles.FieldLabel}>
                        Maquininha {maquininhaIndex + 1}
                      </p>
                      <div className={styles.InputField}>
                        <p className={styles.FieldLabel}>Filipeta Maquininha</p>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          style={{ display: "none" }}
                          ref={(el) => {
                            // @ts-ignore

                            maquininhasRefs.current[maquininhaIndex + 2] = el;
                          }}
                          // @ts-ignore
                          onChange={handleImageChange(maquininhaIndex, 2)}
                        />
                        <button
                          onClick={() =>
                            maquininhasRefs.current[
                              maquininhaIndex + 2
                              // @ts-ignore
                            ]?.click()
                          }
                          className={styles.MidiaField}
                        >
                          Carregue sua foto
                        </button>
                        {maquininhasImages[maquininhaIndex + 1] &&
                          maquininhasImages[maquininhaIndex + 1][0] && (
                            <div>
                              <img
                                // @ts-ignore
                                src={maquininhasImages[maquininhaIndex + 1][0]}
                                alt={`Preview da Filipeta Maquininha ${
                                  maquininhaIndex + 1
                                }`}
                                style={{
                                  maxWidth: "17.5rem",
                                  height: "auto",
                                  border: "1px solid #939393",
                                  borderRadius: "20px",
                                }}
                                onLoad={() =>
                                  URL.revokeObjectURL(
                                    // @ts-ignore
                                    maquininhasImages[maquininhaIndex + 1][0]
                                  )
                                }
                              />
                              <p className={styles.fileName}>
                                {maquininhasFileNames[maquininhaIndex + 1][0]}
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  )
                )}
              </div>

              <p className={styles.BudgetTitle}>Preços</p>
              <p className={styles.Notes}>
                Informe abaixo as informações dos preços
              </p>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Preço GC</p>
                  <input
                    type="text"
                    className={styles.Field}
                    value={gcPrice}
                    onChange={handleInputChange(setGcPrice)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Preço ET</p>
                  <input
                    type="text"
                    className={styles.Field}
                    value={etPrice}
                    onChange={handleInputChange(setEtPrice)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Preço GA</p>
                  <input
                    type="text"
                    className={styles.Field}
                    value={gaPrice}
                    onChange={handleInputChange(setGaPrice)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Preço S10</p>
                  <input
                    type="text"
                    className={styles.Field}
                    value={s10Price}
                    onChange={handleInputChange(setS10Price)}
                    placeholder=""
                  />
                </div>
              </div>

              <p className={styles.BudgetTitle}>Vendas Combústiveis</p>
              <p className={styles.Notes}>
                Informe abaixo as informações das vendas
              </p>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Vendas GC</p>
                  <input
                    type="text"
                    className={styles.Field}
                    value={gcSales}
                    onChange={handleInputChange(setGcSales)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Vendas ET</p>
                  <input
                    type="text"
                    className={styles.Field}
                    value={etSales}
                    onChange={handleInputChange(setEtSales)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Vendas GA</p>
                  <input
                    type="text"
                    className={styles.Field}
                    value={gaSales}
                    onChange={handleInputChange(setGaSales)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Vendas S10</p>
                  <input
                    type="text"
                    className={styles.Field}
                    value={s10Sales}
                    onChange={handleInputChange(setS10Sales)}
                    placeholder=""
                  />
                </div>
              </div>

              <p className={styles.BudgetTitle}>Movimento</p>
              <p className={styles.Notes}>
                Informe abaixo as informações do movimento
              </p>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Dinheiro</p>
                  <input
                    type="text"
                    className={styles.Field}
                    value={cash}
                    onChange={handleInputChange(setCash)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Débito</p>
                  <input
                    type="text"
                    className={styles.Field}
                    value={debit}
                    onChange={handleInputChange(setDebit)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Crédito</p>
                  <input
                    type="text"
                    className={styles.Field}
                    value={credit}
                    onChange={handleInputChange(setCredit)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Pix</p>
                  <input
                    type="text"
                    className={styles.Field}
                    value={pix}
                    onChange={handleInputChange(setPix)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Total Despesas</p>
                  <input
                    id="totalExpenses"
                    type="text"
                    className={styles.Field}
                    value={totalExpenses.toFixed(2)}
                    onChange={(e) =>
                      setTotalExpenses(parseFloat(e.target.value))
                    }
                    placeholder=""
                    disabled
                  />
                </div>
              </div>

              <p className={styles.BudgetTitle}>Despesas</p>
              <p className={styles.Notes}>
                Informe abaixo as informações das despesas
              </p>

              {expenses.map((expense, index) => (
                <div key={index} className={styles.InputContainer}>
                  <div className={styles.InputField}>
                    <p className={styles.FieldLabel}>Valor da despesa</p>
                    <input
                      type="text"
                      className={styles.Field}
                      value={expense.expenseValue}
                      onChange={(e) =>
                        handleExpenseChange(
                          index,
                          "expenseValue",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className={styles.InputField}>
                    <p className={styles.FieldLabel}>Tipo de Despesa</p>
                    <input
                      type="text"
                      className={styles.Field}
                      value={expense.expenseType}
                      onChange={(e) =>
                        handleExpenseChange(
                          index,
                          "expenseType",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  {expenses.length > 1 && (
                    <button
                      onClick={() => removeExpense(index)}
                      className={styles.DeleteButton}
                    >
                      <span className={styles.buttonText}>Excluir despesa</span>
                    </button>
                  )}

                  <button onClick={addExpense} className={styles.NewButton}>
                    <span className={styles.buttonText}>Nova despesa</span>
                  </button>
                </div>
              ))}

              <p className={styles.BudgetTitle}>Comprovante de aferição</p>
              <p className={styles.Notes}>
                Informe abaixo as informações do comprovante
              </p>
              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    ref={mediaRef}
                    // @ts-ignore
                    onChange={handleMediaChange}
                  />
                  <button
                    onClick={() => mediaRef.current?.click()}
                    className={styles.MidiaField}
                  >
                    Carregue seu comprovante
                  </button>
                  {mediaFile && (
                    <div>
                      <p className={styles.fileName}>{mediaFileName}</p>
                    </div>
                  )}
                </div>
              </div>

              <p className={styles.BudgetTitle}>Total</p>
              <p className={styles.Notes}>
                Informe abaixo as informações do total
              </p>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Total Saída</p>
                  <input
                    id="totalOutput"
                    type="text"
                    className={styles.Field}
                    value={totalOutput.toFixed(2)}
                    onChange={(e) => setTotalOutput(parseFloat(e.target.value))}
                    placeholder=""
                    disabled
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Total Entrada</p>
                  <input
                    id="totalInput"
                    type="text"
                    className={styles.Field}
                    value={totalInput.toFixed(2)}
                    onChange={(e) => setTotalInput(parseFloat(e.target.value))}
                    placeholder=""
                    disabled
                  />
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Diferença</p>
                  <input
                    id="difference"
                    type="text"
                    className={styles.Field}
                    value={difference.toFixed(2)}
                    onChange={(e) => setDifference(parseFloat(e.target.value))}
                    placeholder=""
                    disabled
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
