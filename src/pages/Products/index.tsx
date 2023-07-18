import Head from "next/head";
import styles from "../../styles/Requests.module.scss";
import { useRouter } from "next/router";

import SideMenuHome from "@/components/SideMenuHome";
import { ChangeEvent, useState, useEffect } from "react";
import Link from "next/link";
import HeaderHome from "@/components/HeaderHome";
import HeaderProducts from "@/components/HeaderProducts";
import SearchInput from "@/components/InputSearch";
import SearchInputList from "@/components/InputSearchList";
import SearchInputListProducts from "@/components/InputSearchListProducts";
import GridComponent from "@/components/GridRequests";
import TableFoam from "@/components/TableFoam";
import TableImpressao from "@/components/TableImpressao";
import TablePaspatur from "@/components/TablePaspatur";
import TablePerfil from "@/components/TablePerfil";
import TableVidro from "@/components/TableVidro";
import Table from "@/components/Table";
import { collection, query, onSnapshot, getFirestore, updateDoc, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Products() {
  const router = useRouter();

  const [openMenu, setOpenMenu] = useState(false); // Inicializa o estado openMenu

  const [filterStates, setFilterStates] = useState({
    foam: false,
    impressao: false,
    paspatur: false,
    perfil: false,
    vidro: false
  });

  const toggleFilter = (key: keyof typeof filterStates) => {
    setFilterStates((prevState) => ({
      ...prevState,
      [key]: !prevState[key]
    }));
  };

  const [openFilter, setOpenFilter] = useState(false);
  const [selectedOption, setSelectedOption] = useState("opcao1");
  const [searchValue, setSearchValue] = useState("");

  const [valueRadio, setValueRadio] = useState("");

  const [orderValue, setOrderValue] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");

  const [increaseValue, setIncreaseValue] = useState<string>("");

  const handleOpenFilter = () => {
    setOpenFilter(!openFilter);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };
  console.log(searchValue);

  const handleOrderValueChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setOrderValue(event.target.value);
  };

  const handleFilterValueChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilterValue(event.target.value);
  };

  const handleIncreaseChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIncreaseValue(event.target.value);
  };

  let userId: string | null;
  if (typeof window !== 'undefined') {
    userId = window.localStorage.getItem('userId');
  }

  const handleIncrease = async () => {
    const increasePercentage = parseFloat(increaseValue) / 100;
    const db = getFirestore();
    const q = query(collection(db, `Login/${userId}/Foam`)); 

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const docRef = doc.ref;
      const oldData = doc.data();
      if (oldData.valorMetro) {
        const newValue = parseFloat(oldData.valorMetro) + parseFloat(oldData.valorMetro) * increasePercentage;
        updateDoc(docRef, { valorMetro: newValue })
          .then(() => {
            console.log("Documento atualizado");
            toast.success("Preços atualizados com sucesso!"); // or do something else on success
          })
          .catch((error) => {
            console.error("Erro ao atualizar Documento: ", error);
            toast.error("Erro ao atualizar os preços dos produtos."); // or handle the error
          });
      }
    });
  };





  return (
    <>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap');
        `}</style>
      </Head>

      <div className={styles.Container}>
        <SideMenuHome
          activeRoute={router.pathname}
          openMenu={openMenu}
        ></SideMenuHome>

        <div className={styles.OrderContainer}>
          <HeaderProducts></HeaderProducts>
          <div className={styles.MainContainer}>

            <div className={styles.ListContainer}>
              <div className={styles.ListMenu}>
                <div className={styles.ListMenu}>
                  <p className={styles.ProductName}>Foam</p>
                  <div
                    className={styles.ListMenuFilter}
                    onClick={() => toggleFilter("foam")}
                  >
                    <img src="./Filter.svg"></img>{" "}
                    <span className={styles.ListMenuFilterText}>Filtros</span>
                  </div>
                  <SearchInputListProducts
                    handleSearchChange={(e) => handleSearchChange(e)}
                  ></SearchInputListProducts>
                </div>

                <div className={styles.ListMenuRight}>
                <div className={styles.searchContainer}>
                    <input
                      type="text"
                      className={styles.InputEdit}
                      placeholder="%"
                      onChange={handleIncreaseChange}
                    />
                  </div>
                  <button 
                  className={styles.AumentoPorcent}
                  onClick={handleIncrease}
                  >
                      <span className={styles.maisNoneMobile}>
                        {" "}
                        Aumentar
                      </span>
                      <span className={styles.maisNone}> +</span>
                    </button>
                  <Link href="/ProductFoam">
                    <button className={styles.ListMenuButton}>
                      <span className={styles.maisNoneMobile}>
                        {" "}
                        Novo Produto
                      </span>
                      <span className={styles.maisNone}> +</span>
                    </button>
                  </Link>
                </div>
              </div>
              <div
                className={`${filterStates.foam
                  ? styles.containerFilter
                  : styles.containerFilterClose
                  }`}
              >
                <div className={styles.listFilter}>
                  <h2>ORDENAR POR:</h2>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="codigoCrescente"
                      name="ordenarPor"
                      value="codigoCrescente"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="codigoCrescente">Codigo crescente</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="codigoDescrescente"
                      name="ordenarPor"
                      value="codigoDescrescente"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="codigoDescrescente">Codigo decrescente</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorLucro"
                      name="ordenarPor"
                      value="maiorLucro"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorLucro">Maior % Lucro</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorValorMetro"
                      name="ordenarPor"
                      value="maiorValorMetro"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorValorMetro">Maior Valor por Metro</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorValorPerda"
                      name="ordenarPor"
                      value="maiorValorPerda"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorValorPerda">Maior Valor da Perda</label>
                  </div>
                </div>
              </div>
              <div className={styles.MarginTop}></div>
              {/* <GridComponent/> */}
              <TableFoam
                searchValue={searchValue}
                orderValue={orderValue}
                filterValue={filterValue}
              />
            </div>

            <div className={styles.ListContainer}>
              <div className={styles.ListMenu}>
                <div className={styles.ListMenu}>
                  <p className={styles.ProductName}>Impressão</p>
                  <div
                    className={styles.ListMenuFilter}
                    onClick={() => toggleFilter("impressao")}
                  >
                    <img src="./Filter.svg"></img>{" "}
                    <span className={styles.ListMenuFilterText}>Filtros</span>
                  </div>
                  <SearchInputListProducts
                    handleSearchChange={(e) => handleSearchChange(e)}
                  ></SearchInputListProducts>
                </div>
                <div className={styles.ListMenuRight}>
                  <Link href="/ProductImpressao">
                    <button className={styles.ListMenuButton}>
                      <span className={styles.maisNoneMobile}>
                        {" "}
                        Novo Produto
                      </span>
                      <span className={styles.maisNone}> +</span>
                    </button>
                  </Link>
                </div>
              </div>
              <div
                className={`${filterStates.impressao
                  ? styles.containerFilter
                  : styles.containerFilterClose
                  }`}
              >
                <div className={styles.listFilter}>
                  <h2>ORDENAR POR:</h2>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="codigoCrescente"
                      name="ordenarPor"
                      value="codigoCrescente"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="codigoCrescente">Codigo crescente</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="codigoDescrescente"
                      name="ordenarPor"
                      value="codigoDescrescente"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="codigoDescrescente">Codigo decrescente</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorLucro"
                      name="ordenarPor"
                      value="maiorLucro"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorLucro">Maior % Lucro</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorValorMetro"
                      name="ordenarPor"
                      value="maiorValorMetro"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorValorMetro">Maior Valor por Metro</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorValorPerda"
                      name="ordenarPor"
                      value="maiorValorPerda"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorValorPerda">Maior Valor da Perda</label>
                  </div>
                </div>
              </div>
              <div className={styles.MarginTop}></div>
              {/* <GridComponent/> */}
              <TableImpressao
                searchValue={searchValue}
                orderValue={orderValue}
                filterValue={filterValue}
              />
            </div>

            <div className={styles.ListContainer}>
              <div className={styles.ListMenu}>
                <div className={styles.ListMenu}>
                  <p className={styles.ProductName}>Paspatur</p>
                  <div
                    className={styles.ListMenuFilter}
                    onClick={() => toggleFilter("paspatur")}
                  >
                    <img src="./Filter.svg"></img>{" "}
                    <span className={styles.ListMenuFilterText}>Filtros</span>
                  </div>
                  <SearchInputListProducts
                    handleSearchChange={(e) => handleSearchChange(e)}
                  ></SearchInputListProducts>
                </div>
                <div className={styles.ListMenuRight}>
                  <Link href="/ProductPaspatur">
                    <button className={styles.ListMenuButton}>
                      <span className={styles.maisNoneMobile}>
                        {" "}
                        Novo Produto
                      </span>
                      <span className={styles.maisNone}> +</span>
                    </button>
                  </Link>
                </div>
              </div>
              <div
                className={`${filterStates.paspatur
                  ? styles.containerFilter
                  : styles.containerFilterClose
                  }`}
              >
                <div className={styles.listFilter}>
                  <h2>ORDENAR POR:</h2>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="codigoCrescente"
                      name="ordenarPor"
                      value="codigoCrescente"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="codigoCrescente">Codigo crescente</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="codigoDescrescente"
                      name="ordenarPor"
                      value="codigoDescrescente"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="codigoDescrescente">Codigo decrescente</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorLucro"
                      name="ordenarPor"
                      value="maiorLucro"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorLucro">Maior % Lucro</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorValorMetro"
                      name="ordenarPor"
                      value="maiorValorMetro"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorValorMetro">Maior Valor por Metro</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorValorPerda"
                      name="ordenarPor"
                      value="maiorValorPerda"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorValorPerda">Maior Valor da Perda</label>
                  </div>
                </div>
              </div>
              <div className={styles.MarginTop}></div>
              {/* <GridComponent/> */}
              <TablePaspatur
                searchValue={searchValue}
                orderValue={orderValue}
                filterValue={filterValue}
              />
            </div>

            <div className={styles.ListContainer}>
              <div className={styles.ListMenu}>
                <div className={styles.ListMenu}>
                  <p className={styles.ProductName}>Perfil</p>
                  <div
                    className={styles.ListMenuFilter}
                    onClick={() => toggleFilter("perfil")}
                  >
                    <img src="./Filter.svg"></img>{" "}
                    <span className={styles.ListMenuFilterText}>Filtros</span>
                  </div>
                  <SearchInputListProducts
                    handleSearchChange={(e) => handleSearchChange(e)}
                  ></SearchInputListProducts>
                </div>
                <div className={styles.ListMenuRight}>
                  <Link href="/ProductPerfil">
                    <button className={styles.ListMenuButton}>
                      <span className={styles.maisNoneMobile}>
                        {" "}
                        Novo Produto
                      </span>
                      <span className={styles.maisNone}> +</span>
                    </button>
                  </Link>
                </div>
              </div>
              <div
                className={`${filterStates.perfil
                  ? styles.containerFilter
                  : styles.containerFilterClose
                  }`}
              >
                <div className={styles.listFilter}>
                  <h2>ORDENAR POR:</h2>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="codigoCrescente"
                      name="ordenarPor"
                      value="codigoCrescente"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="codigoCrescente">Codigo crescente</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="codigoDescrescente"
                      name="ordenarPor"
                      value="codigoDescrescente"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="codigoDescrescente">Codigo decrescente</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorLucro"
                      name="ordenarPor"
                      value="maiorLucro"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorLucro">Maior % Lucro</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorValorMetro"
                      name="ordenarPor"
                      value="maiorValorMetro"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorValorMetro">Maior Valor por Metro</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorValorPerda"
                      name="ordenarPor"
                      value="maiorValorPerda"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorValorPerda">Maior Valor da Perda</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorLargura"
                      name="ordenarPor"
                      value="maiorLargura"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorLargura">Maior Largura</label>
                  </div>
                </div>
              </div>
              <div className={styles.MarginTop}></div>
              {/* <GridComponent/> */}
              <TablePerfil
                searchValue={searchValue}
                orderValue={orderValue}
                filterValue={filterValue}
              />
            </div>

            {/* NOME PRODUTO */}
            <div className={styles.ListContainer}>
              <div className={styles.ListMenu}>
                <div className={styles.ListMenu}>
                  <p className={styles.ProductName}>Vidro</p>
                  <div
                    className={styles.ListMenuFilter}
                    onClick={() => toggleFilter("vidro")}
                  >
                    <img src="./Filter.svg"></img>{" "}
                    <span className={styles.ListMenuFilterText}>Filtros</span>
                  </div>
                  <SearchInputListProducts
                    handleSearchChange={(e) => handleSearchChange(e)}
                  ></SearchInputListProducts>
                </div>
                <div className={styles.ListMenuRight}>
                  <Link href="/ProductVidro">
                    <button className={styles.ListMenuButton}>
                      <span className={styles.maisNoneMobile}>
                        {" "}
                        Novo Produto
                      </span>
                      <span className={styles.maisNone}> +</span>
                    </button>
                  </Link>
                </div>
              </div>
              <div
                className={`${filterStates.vidro
                  ? styles.containerFilter
                  : styles.containerFilterClose
                  }`}
              >
                <div className={styles.listFilter}>
                  <h2>ORDENAR POR:</h2>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="codigoCrescente"
                      name="ordenarPor"
                      value="codigoCrescente"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="codigoCrescente">Codigo crescente</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="codigoDescrescente"
                      name="ordenarPor"
                      value="codigoDescrescente"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="codigoDescrescente">Codigo decrescente</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorLucro"
                      name="ordenarPor"
                      value="maiorLucro"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorLucro">Maior % Lucro</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorValorMetro"
                      name="ordenarPor"
                      value="maiorValorMetro"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorValorMetro">Maior Valor por Metro</label>
                  </div>
                  <div className={styles.filterItem}>
                    <input
                      type="radio"
                      id="maiorValorPerda"
                      name="ordenarPor"
                      value="maiorValorPerda"
                      onChange={handleOrderValueChange}
                      className={styles.filterItem}
                    />
                    <label htmlFor="maiorValorPerda">Maior Valor da Perda</label>
                  </div>
                </div>
              </div>
              <div className={styles.MarginTop}></div>
              {/* <GridComponent/> */}
              <TableVidro
                searchValue={searchValue}
                orderValue={orderValue}
                filterValue={filterValue}
              />
            </div>
          </div>

          <div className={styles.Copyright}>
            <p className={styles.Copy}>
              © Total Maxx 2023, todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
