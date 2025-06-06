## \:fuelpump: Tankup - App para encontrar combustível mais barato

### \:bulb: Conceito

Aplicação Android (ideal para Android Auto ou head unit) que usa a localização GPS para mostrar os postos de abastecimento mais baratos nas redondezas, com opções de navegação rápida por Google Maps, Waze ou Apple Maps. **Válido apenas para Portugal**

---

### \:star: Funcionalidades Principais

* Localização GPS em tempo real
* Consulta de preços de combustível (gasolina, gasóleo, GPL, etc.)
* Ordenação por preço ou distância.
* Abertura direta de rotas em Google Maps, Waze ou Apple Maps
* Guardar postos favoritos localmente 
* Interface simples, com botões grandes e modo escuro
* Pesquisa de postos num distrito ou cidade específico

---

### \:world\_map: Fontes de Dados

**Portugal**:

* Dados disponibilizados pela DGEG:
  * [https://precoscombustiveis.dgeg.gov.pt](https://precoscombustiveis.dgeg.gov.pt)
* E por uma API interna.

---

### \:iphone: Stack Técnica

#### Frontend / App

* Plataforma: Expo-Router (React Native)
* UI: Material Design
* GPS: Expo Location
* Requests: fetch/axios

---

### \:rocket: MVP - Primeira Versão

1. Obter localização atual do utilizador. ✅
2. Mostrar lista dos postos por filtro num raio de 5/10/20 km. ✅
3. Mostrar tipo de combustível, preço, distância atual. ✅
4. Botões "Abrir no Google Maps", "Abrir no Waze". ✅
5. Pesquisa por tipo de combustível. ✅
6. Permitir em alternativa pesquisar por Distrito e Concelho manualmente. ✅
7. Funcionalidades sem permitir localização. ✅

---

### \:rocket: Necessidades

1. Tem que ser uma aplicação **leve**, com um máximo de 30 MB.
2. Tem que estar bem optimizada para dispositivos menos potentes.
3. Sem conta para utilização — completamente como ferramenta anónima.

---

### \:art: Interface (UI)

#### Ecrã principal

* Mapa centrado na localização do utilizador
* Lista abaixo:

  * Nome do posto
  * Tipo e preço do combustível
  * Distância (ex: 2.3 km)
  * Botões: `[Maps] [Waze] [Apple Maps]`
  * Ícone da marca (Galp, BP, Prio, etc.)

---

### \:white\_check\_mark: Futuras Funcionalidades

* Voz: "Leva-me ao posto mais barato"
* Cache offline temporária para zonas com pouca ligação

---

### \:lock: Privacidade e Permissões

* A aplicação **não recolhe nem armazena dados pessoais**.
* A localização é usada **apenas** para apresentar postos de abastecimento próximos.

---

### \:page\_facing\_up: Licença e Créditos

* Dados por: DGEG - dados.gov.pt
* Open source: MIT License
* Desenvolvido por: Miguel Areal
