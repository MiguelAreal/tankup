## \:fuelpump: Tankup - App para encontrar combustível mais barato

Nota: Este repositório é apenas para o front-end.

### \:bulb: Conceito
Aplicação Web, Android e IOS que utiliza a localização GPS para mostrar os postos de abastecimento mais baratos nas redondezas, com opções de navegação rápida por Google Maps, Waze ou Apple Maps. **Válido apenas para Portugal**

---

### \:star: Funcionalidades Principais

* Localização GPS em tempo real
* Consulta de preços de combustível (gasolina, gasóleo, GPL, etc.)
* Ordenação por preço ou distância.
* Abertura direta de rotas em Google Maps, Waze ou Apple Maps
* Guardar postos favoritos localmente 
* Interface simples, com botões grandes e modo escuro
* Pesquisa de postos num distrito/cidade específica

---

### \:world\_map: Fontes de Dados

**Portugal**:

* Dados disponibilizados pela DGEG:
  * [https://precoscombustiveis.dgeg.gov.pt](https://precoscombustiveis.dgeg.gov.pt)
* E por uma API interna.

---

### Stack Técnica

#### Frontend / App

* Framework: Expo-Router (React Native)
* UI: Material Design
* GPS: Expo Location
* Requests: fetch/axios

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
### \:lock: Privacidade e Permissões

* A aplicação **não armazena dados pessoais**.
* A localização recolhida é usada **apenas** para apresentar postos de abastecimento próximos, de seguida sendo descartada.

---

### \:page\_facing\_up: Licença e Créditos

* Dados por: DGEG - dados.gov.pt
* Open source: MIT License
* Desenvolvido por: Miguel Areal
