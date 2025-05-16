## \:fuelpump: Tankup - App para encontrar combustível mais barato

### \:bulb: Conceito

Aplicação Android (ideal para Android Auto ou head unit) que usa a localização GPS para mostrar os postos de abastecimento mais baratos nas redondezas, com opções de navegação rápida por Google Maps, Waze ou Apple Maps. **Válido apenas para Portugal**

---

### \:star: Funcionalidades Principais

* Localização GPS em tempo real
* Consulta de preços de combustível (gasolina, gasóleo, GPL, etc.)
* Ordenação por preço ou distância
* Abertura direta de rotas em Google Maps, Waze ou Apple Maps
* Guardar postos favoritos
* Interface simples, com botões grandes e modo escuro

---

### \:world\_map: Fontes de Dados

**Portugal**:

* Dados disponibilizados pelo site da DGEG:

  * [https://precoscombustiveis.dgeg.gov.pt](https://precoscombustiveis.dgeg.gov.pt)
  * Nota: Os dados não são providenciados via API com autenticação, sendo necessário fazer parsing dos ficheiros publicados (CSV/XML) ou de HTML/XML.

---

### \:iphone: Stack Técnica

#### Frontend / App

* Plataforma: Expo-Router (React Native)
* UI: Material Design com botões grandes e tema escuro
* GPS: Expo Location
* Requests: fetch/axios

---

### \:rocket: MVP - Primeira Versão

1. Obter localização atual do utilizador.
2. Identificar distrito e concelho a partir da localização atual.
3. Mostrar lista dos 5 postos mais baratos num raio de 5 km.
4. Mostrar tipo de combustível, preço, distância atual.
5. Botões "Abrir no Google Maps", "Abrir no Waze".
6. Pesquisa por tipo de combustível.
7. Permitir em alternativa pesquisar por Distrito e Concelho manualmente.

---

### \:rocket: Necessidades

1. Tem que ser uma aplicação **leve**, com um máximo de 30 MB.
2. Tem que estar bem optimizada para head units menos potentes.
3. Sem conta para utilização — completamente como ferramenta anónima.

---

### \:art: Ideia de Interface (UI)

#### Ecrã principal

* Mapa centrado na localização do utilizador
* Lista abaixo:

  * Nome do posto
  * Tipo e preço do combustível
  * Distância (ex: 2.3 km)
  * Botões: `[Maps] [Waze] [Apple Maps]`
  * Ícone da marca (Galp, BP, Prio, etc.) opcional

---

### \:white\_check\_mark: Futuras Funcionalidades

* Voz: "Leva-me ao posto mais barato"
* Histórico de abastecimentos
* Integração com sensores OBD2 para mostrar autonomia restante de combustível
* Cache offline temporária para zonas com pouca ligação

---

### \:lock: Privacidade e Permissões

* A aplicação **não recolhe nem armazena dados pessoais**.
* A localização é usada **apenas localmente** para apresentar postos de abastecimento próximos.

---

### \:page\_facing\_up: Licença e Créditos

* Dados por: DGEG - dados.gov.pt
* Open source: MIT License
* Desenvolvido por: Miguel Areal
