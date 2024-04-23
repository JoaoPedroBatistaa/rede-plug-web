import Head from "next/head";
import { useRouter } from "next/router";
import styles from "../styles/ProductFoam.module.scss";

import HeaderNewProduct from "@/components/HeaderNewTask";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useState } from "react";
import { db } from "../../firebase";

import LoadingOverlay from "@/components/Loading";

export default function NewPost() {
  const router = useRouter();
  const postName = router.query.postName;
  console.log(postName);

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
  const [expenses, setExpenses] = useState("");

  // States para total de entrada e saída
  const [totalOutput, setTotalOutput] = useState("");
  const [totalInput, setTotalInput] = useState("");
  const [difference, setDifference] = useState("");

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
      where("id", "==", "turno-1"),
      where("userName", "==", userName),
      where("postName", "==", postName)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      toast.error("O relatório de turno 1 já foi feito hoje!");
      setIsLoading(false);

      return;
    }

    const taskData = {
      date,
      time,
      attendant,
      postName,
      shift: "01",
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
      expenses,
      totalOutput,
      totalInput,
      difference,
      observations,
      id: "turno-1",
    };

    try {
      const docRef = await addDoc(collection(db, "ATTENDANTS"), taskData);
      console.log("Tarefa salva com ID: ", docRef.id);
      toast.success("Tarefa salva com sucesso!");
      // @ts-ignore
      router.push(`/attendants?post=${encodeURIComponent(postName)}`);
    } catch (error) {
      console.error("Erro ao salvar os dados da tarefa: ", error);
      toast.error("Erro ao salvar a medição.");
    }
  };

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
            <p className={styles.BudgetTitle}>Relatório de turno 01</p>
            <div className={styles.BudgetHeadS}>
              <button className={styles.FinishButton} onClick={saveMeasurement}>
                <img
                  src="./finishBudget.png"
                  alt="Finalizar"
                  className={styles.buttonImage}
                />
                <span className={styles.buttonText}>Cadastrar relatório</span>
              </button>
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

              <p className={styles.BudgetTitle}>Preços</p>
              <p className={styles.Notes}>
                Informe abaixo as informações dos preços
              </p>

              <div className={styles.InputContainer}>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Preço GC</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={gcPrice}
                    onChange={(e) => setGcPrice(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Preço ET</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={etPrice}
                    onChange={(e) => setEtPrice(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Preço GA</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={gaPrice}
                    onChange={(e) => setGaPrice(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Preço S10</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={s10Price}
                    onChange={(e) => setS10Price(e.target.value)}
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
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={gcSales}
                    onChange={(e) => setGcSales(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Vendas ET</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={etSales}
                    onChange={(e) => setEtSales(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Vendas GA</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={gaSales}
                    onChange={(e) => setGaSales(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Vendas S10</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={s10Sales}
                    onChange={(e) => setS10Sales(e.target.value)}
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
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Débito</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={debit}
                    onChange={(e) => setDebit(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Crédito</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Pix</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={pix}
                    onChange={(e) => setPix(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Despesas</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder=""
                  />
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
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={totalOutput}
                    onChange={(e) => setTotalOutput(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Total Entrada</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={totalInput}
                    onChange={(e) => setTotalInput(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div className={styles.InputField}>
                  <p className={styles.FieldLabel}>Diferença</p>
                  <input
                    id="attendant"
                    type="text"
                    className={styles.Field}
                    value={difference}
                    onChange={(e) => setDifference(e.target.value)}
                    placeholder=""
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
