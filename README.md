# 英雄資訊網

本專案提供可用來查詢英雄基本機料及能力值的HTTP伺服器。詳細的API規範，請參考[openapi.yaml](openapi.yaml)。

## 啟動步驟

### 原生執行

首先確認系統有安裝[Node.js](https://nodejs.org/)，再來執行以下命令：

```bash
$ npm install -g pnpm
$ pnpm i
$ pnpm build
$ node dist/server.js
```

### Docker執行

伺服器也可以在[Docker](https://www.docker.com/)容器內執行。

```bash
$ docker build . -t heroes
$ docker run -p 8080:8080 heroes
```

## 架構說明

專案的架構大致可分為[models](models/)、[repos](repos/)、[routes](routes/)等三個主要的模組。其中models負責定義核心共用的資料結構，如所有英雄相關的類型。repos則負責定義外部資源（如REST API、資料庫等）的抽象介面，以及該資源的獲取方式，此模組佔專案的大部分行數。最後，routes負責實作對外的HTTP介面，以及針對各個進來請求進行對應的repo操作。

## 註解原則

原則上，凡是全域變數、頂層語句以及從模組匯出的類別、介面及定義等等都會加註TSDoc的說明註解。除了作者覺得特別值得注意或容易誤解的語句以外，一般程式碼則不多贅述。

## 依賴

### 生產環境

生產環境的依賴只有五個，以下簡單說明其用途。

- koa
  - 輕量化的HTTP伺服器框架，基本上只提供請求處理的機制，其他得自己另外裝middleware
- koa-router
  - 架於koa上面的middleware，讓開發者更容易依照請求路徑的特性，來整理進來請求的處理邏輯
- koa-logger
  - 架於koa上面的middleware，提供簡單的HTTP請求紀錄功能
- ajv
  - JSON Schema的驗證套件，可用JSON Schema明確定義預期的請求結構，再利用ajv進行物件驗證
- ajv-formats
  - ajv的延伸套件，提供JSON Schema的屬性格式驗證功能

### 開發環境

開發依賴中，除了@types/*類的提供ts定義檔以外，還有幾個比較值得說明的套件。

- eslint
  - 提供一套規則讓專案程式碼的風格能維持一致性，也能助於提高程式碼的品質
- prettier
  - 和eslint相似，但著重於程式碼風格本身而非其他撰寫程式的規則
- tsc-alias
  - 用於ts編譯後的工具，將ts的匯入別名轉為相對應的js版本

## TODO

- [ ] 從設定檔及環境變數載入伺服器設定
- [ ] 設計並實作快取策略