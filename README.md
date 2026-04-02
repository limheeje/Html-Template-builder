```
"scripts": {
    "dev": "concurrently \"npm run nodemon\" \"npm run browser-sync\"",
    "build": "cross-env NODE_ENV=production node build",
    "nodemon": "cross-env NODE_ENV=local nodemon",
    "browser-sync": "cross-env NODE_ENV=local browser-sync start --config ./config/browser-sync.js"
}
```
```bash
npm install
npm run dev
---------------
npm run build
```


#### 추가된기능
- 파일 디렉토리 작성가능
    - src/pages/.../.../index.ejs
- 레이아웃선언가능
src/pages/.. 안에 EJS파일만 layout선언가능
#### 전역변수
- process : NodeJS 시스템 변수 추가
- _ (lodash) : Object탐색 라이브러리
- $t : i18n 문자변환 함수
- $currentLocale : i18n 현재 언어 코드
- $i18nConfig : i18n config 내용
    ```javascript 
    /**
    * 다국어 지원안한다면, 
    * LANG_TYPE: {KO:'ko'} 만 선언
    */
    module.exports = {
        LANG_DEFAULT_LOCALE: "ko",
        LANG_TYPE: {
            KO: "ko",
            EN: "en",
            CN: "cn",
            JP: "jp",
            SP: "sp"
        }
    }

    ```
- $staticSrc 전역 변수 추가 
```html
<img src="<%-$staticSrc('@/static/images/logo-basic.svg')%>" />
```

- $rootSrc  전역 변수 추가 
```javascript
<%-include($rootSrc('@/components/Bs.ejs'), {
    props:{
        test: 1
    }
})%>
```
#### 첫시작시 필수로 있어야하는 파일
- src/layouts/default.ejs
- src/layouts/markuplist.ejs
- src/@index.ejs 
    - 마크업리스트용
- src/pages/index.ejs 
    - 파일명이 index가 아니더래도 pages안에 ejs파일 하나는 필수
#### server.js
- run 개발서버
- src/pages/..
    - 해당경로의 ejs확장자 watch 실행(추가,수정)
        - nodemon & browserSync로 저장시 라이브리로드 진행
        - chokidar.watch 로 디렉토리 변이 감지하여 웹라우팅 재실행
            ```javascript
            watcher.on('add', (filePath) => callback)
            watcher.on('change', (filePath) => callback)
            watcher.on('addDir', (filePath) => callback)
            ```
    - ※ app.get 서버실행 후 해당 EJS파일의 데이타전달
        ```javascript
        app.get(
            ... 

            await setRoute(dirPath, filename)
            const jsFilePath = await path.join(__dirname, '.routes', `${routePath}.js`)
            const {layout, asyncData, ...params} = require(jsFilePath)
            const getHtml = (url) => {...}
            const _asyncData = asyncData ? await asyncData({getHtml}).then((params) => params) : {}

            res.render(`pages/${routePath}`, {
                _,
            process,
            defineExport: (o) => ({
                bind: () => {
                return o
                }
            }),
            ..._asyncData,
            layout: `layouts/${layout || 'default'}`,
            data: {},
            props: {},
            head: {},
            ...params
                //해당 pages/${}.ejs 에 전달할 데이타선언
            })

            ...
        )
        ```
- 소스 작성
    - src/pages/...ejs 생성하여 웹Route 생성
        - src/pages/**index.ejs** 생성시, 
        http://{localhost}/**index**
        http://{localhost}/**{언어별}/index**
        - src/pages/**subpage/index.ejs** 생성시, 
        http://{localhost}/**subpage/index**
        http://{localhost}**{언어별}/subpage/index**
    - src/pages/index.ejs
        ```javascript
        <% 
        // src/pages/.. 안에서만 defineExport({}).bind() 사용가능
        // Client -> Server로 값을 보내기위한 함수
        // Server 에서 app.get()시 defineExport의 리턴값이 /.route 폴더에 commonJS형태로 생성
        defineExport({
            layout: 'login', //default 사용시 생략
            head: { //페이지별 <head> 정보 삽입가능
                title: 'html-title', //<title>html-title</title>
                meta:[
                    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
                ],
                script: [],
                link: [],
            },
            async asyncData({getHtml}){ 
                // 현재는 getHtml()만 기능있음
                // 외부에 생성되어있는 html파일을 해당 프로젝트로 불러오기위함
                const term1 = await getHtml('https://cdn.kcp.co.kr/uiteam/design/hj2/terms/term1.html')
                return {
                    term1, // data
                }
            },
        }).bind()
        // 기타등등 로컬적으로 사용할 변수들선언 
        const {} = props || {}
        %>

        <div>...</div>
        ```
    - 프로세스 이해
        - 웹URL(Route) 생성
            - src/pages/...ejs 생성
        - page성격의 컴포넌트 생성
            - 해당 파일에서 페이지상태별 분기 처리
        - 공통 컴포넌트 작성
            - Button, Input, Checkbox, Modal 등
        - 공통 컴포넌트 기준으로 UI생성
            - Button + Input = SearchBar 등
    