import Head from "next/head";
import { useRouter } from "next/router";
import styles from "../styles/ProductFoam.module.scss";

import HeaderNewProduct from "@/components/HeaderNewTask";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { createRef, useEffect, useRef, useState } from "react";
import { db, storage } from "../../firebase";

import LoadingOverlay from "@/components/Loading";

export default function NewPost() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [managerName, setManagerName] = useState("");
  const [numMaquininhas, setNumMaquininhas] = useState(3);
  const [maquininhasImages, setMaquininhasImages] = useState<File[]>([]);
  const [maquininhasFileNames, setMaquininhasFileNames] = useState<string[]>(
    []
  );

  const maquininhasRefs = useRef([]);
  maquininhasRefs.current = Array(numMaquininhas)
    .fill(null)
    .map((_, i) => maquininhasRefs.current[i] || createRef());

  const handleNumMaquininhasChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = parseInt(event.target.value, 10);
    value = isNaN(value) ? 3 : value;
    value = value < 3 ? 3 : value;
    setNumMaquininhas(value);
  };

  const handleImageChange =
    (index: string | number | undefined) =>
    (event: { target: { files: any[] } }) => {
      const file = event.target.files[0];
      if (file) {
        setMaquininhasImages((prev) => {
          const newImages = [...prev];
          // @ts-ignore
          newImages[index] = file;
          return newImages;
        });
        setMaquininhasFileNames((prev) => {
          const newFileNames = [...prev];
          // @ts-ignore
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
          });
        } catch (error) {
          console.error("Error fetching post details:", error);
        }
      };

      fetchPostDetails();
    }
  }, []);

  const savePhotoMachines = async () => {
    setIsLoading(true);

    let missingField = "";
    const today = new Date().toISOString().slice(0, 10);

    if (!date) missingField = "Data";
    else if (date !== today) {
      toast.error("Você deve cadastrar a data correta de hoje!");
      setIsLoading(false);

      return;
    } else if (!time) missingField = "Hora";
    else if (!managerName) missingField = "Nome do Gerente";
    else if (maquininhasImages.length === 0)
      missingField = "Verficação dos cavaletes";

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
      where("id", "==", "verificacao-cavaletes-22h"),
      where("userName", "==", userName)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      toast.error("A verificação dos cavaletes das 22h já foi feita hoje!");
      setIsLoading(false);

      return;
    }

    const photoMachinesData = {
      date,
      time,
      managerName,
      userName,
      postName,
      images: [],
      id: "verificacao-cavaletes-22h",
    };

    // Processamento paralelo dos uploads de imagens
    const uploadPromises = maquininhasImages.map((imageFile, index) =>
      uploadImageAndGetUrl(
        imageFile,
        `photoMachines/${date}/${imageFile.name}_${Date.now()}`
      ).then((imageUrl) => {
        return {
          fileName: maquininhasFileNames[index],
          imageUrl,
        };
      })
    );

    try {
      const images = await Promise.all(uploadPromises);
      // @ts-ignore
      photoMachinesData.images = images;

      const docRef = await addDoc(
        collection(db, "MANAGERS"),
        photoMachinesData
      );
      console.log("Verificação dos cavaletes salvo com ID: ", docRef.id);
      toast.success("Verificação dos cavaletes salva com sucesso!");
      router.push("/manager-twenty-two-routine");
    } catch (error) {
      console.error("Erro ao salvar a verificação dos cavaletes: ", error);
      toast.error("Erro ao salvar a verificação dos cavaletes.");
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
            <p className={styles.BudgetTitle}>Verificação dos cavaletes 22h</p>
            <div className={styles.BudgetHeadS}>
              <button
                className={styles.FinishButton}
                onClick={savePhotoMachines}
              >
                <img
                  src="./finishBudget.png"
                  alt="Finalizar"
                  className={styles.buttonImage}
                />
                <span className={styles.buttonText}>Cadastrar fotos</span>
              </button>
            </div>
          </div>

          <p className={styles.Notes}>
            Informe abaixo as informações das maquininhas
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
                  <p className={styles.FieldLabel}>Nome do gerente</p>
                  <input
                    id="driverName"
                    type="text"
                    className={styles.Field}
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder=""
                  />
                </div>

                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Número de cavaletes</p>
                  <input
                    type="number"
                    className={styles.Field}
                    value={numMaquininhas}
                    onChange={handleNumMaquininhasChange}
                    placeholder=""
                  />
                </div>
              </div>

              {Array.from({ length: numMaquininhas }, (_, index) => (
                <div key={index} className={styles.InputField}>
                  <p className={styles.FieldLabel}>
                    Foto do cavalete {index + 1}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    // @ts-ignore
                    ref={(el) => (maquininhasRefs.current[index] = el)}
                    // @ts-ignore
                    onChange={handleImageChange(index)}
                  />
                  <button
                    // @ts-ignore
                    onClick={() => maquininhasRefs.current[index]?.click()}
                    className={styles.MidiaField}
                  >
                    Carregue sua foto
                  </button>
                  {maquininhasImages[index] && (
                    <div>
                      <img
                        src={URL.createObjectURL(maquininhasImages[index])}
                        alt={`Preview da maquininha ${index + 1}`}
                        style={{
                          maxWidth: "17.5rem",
                          height: "auto",
                          border: "1px solid #939393",
                          borderRadius: "20px",
                        }}
                        onLoad={() =>
                          // @ts-ignore
                          URL.revokeObjectURL(maquininhasImages[index])
                        }
                      />
                      <p className={styles.fileName}>
                        {maquininhasFileNames[index]}
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
