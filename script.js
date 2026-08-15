// =====================================================
// WAC Prototype 0.3.1
// JSONデータから系統ツリーを自動生成する
// =====================================================


// 読み込んだ全ノードを保存する場所

const nodes = [];

// node_key → JSON を高速検索する辞書
const nodeMap = {};

// ページ読み込み時

window.addEventListener(
"DOMContentLoaded",
async()=>{

    // 一覧JSON取得

    const list =
        await fetch("data/language.json");

    const listData =
        await list.json();


    // 全JSON読み込み

    for(const file of listData.languages){

        const res =
            await fetch(`data/${file}`);
        
        console.log(file);

    for (const node of nodes) {
        if (node.parent && !nodes.some(n => n.node_key === node.parent)) {
            console.error(
              `親ノード不存在: ${node.name} -> ${node.parent}`
            );
        }
    }

        const data =
            await res.json();

        console.log("読み込み成功:", file);
        
        nodes.push(data);

        // node_keyで検索できるよう登録
        nodeMap[data.node_key] = data;

    }


    // ルートノード表示

    const tree =
        document.getElementById("tree");

    nodes
    .filter(n=>!n.parent)
    .forEach(root=>{

        tree.appendChild(
            createNode(root, true)
        );
    });
});

// =====================================================
// ノードのラベルを作る関数
// =====================================================

function buildNodeLabel(node){

    return `

        <span class="node-label">
            ${
                node.flag_image
                ? `<img class="tree-flag" src="${node.flag_image}">`
                : ""
            }

            ${node.name}
        </span>
    `;

}


// =====================================================
// ノードをHTML化する関数
// =====================================================

function createNode(node, isRoot = false){

    const div =
        document.createElement("div");

    div.className = isRoot
        ? "node root"
        : "node";


    // 子ノードを探す

    const children =
        nodes.filter(
            n=>n.parent===node.node_key
        );


    // ==============================
    // 子ノードあり
    // ==============================

    if(children.length>0){

        const details =
            document.createElement("details");


        const summary =
            document.createElement("summary");


        summary.innerHTML =
            buildNodeLabel(node);



        // 情報ボタン
        const infoButton =
            document.createElement("span");


        infoButton.className="info-mark";

        infoButton.textContent="ⓘ";


        summary.appendChild(infoButton);



        // ⓘクリックでは展開させない
        infoButton.addEventListener(
            "click",
            (event)=>{

                event.preventDefault();

                event.stopPropagation();

                showCard(node);

            }
        );



        details.appendChild(summary);



        const childBox =
            document.createElement("div");


        childBox.className="children";



        children.forEach(child=>{

            childBox.appendChild(
                createNode(child)
            );

        });



        details.appendChild(childBox);



        div.appendChild(details);



        // 名前部分クリックでカード表示しない
        // summaryはdetails標準開閉に任せる



    }


    // ==============================
    // 末端ノード
    // ==============================

    else{


        div.innerHTML =
            buildNodeLabel(node);



        const infoButton =
            document.createElement("span");


        infoButton.className="info-mark";

        infoButton.textContent="ⓘ";


        div.appendChild(infoButton);



        // 名前・ⓘどちらでもカード表示

        div.addEventListener(
            "click",
            (event)=>{

                event.stopPropagation();

                showCard(node);

            }
        );


    }



    return div;

}



// =====================================================
// パンくずリスト生成
// 親ノードをクリックするとそのカードを表示
// =====================================================

function buildBreadcrumb(node){

    const list = [];

    let current = node;


    while(current){

        list.unshift(current);

        current = nodeMap[current.parent];

    }



    return list
    .map((item,index)=>{


        // 最後（現在位置）はクリック不可
        if(index === list.length - 1){

            return `
            <span class="breadcrumb-current">
                ${item.name}
            </span>
            `;

        }


        // 親ノードはクリック可能
        else{

            return `
            <span
                class="breadcrumb-link"
                data-node="${item.node_key}">
                ${item.name}
            </span>
            `;

        }


    })
    .join(" ＞ ");

}


// =======================================
// 言語的特徴
// =======================================
function buildFeatureSection(node){

// 特徴が存在するか
    const hasFeature =
        node.features?.length > 0;

    if(!hasFeature){
        return "";
    }

// <li>を作る
    const featureHTML =
        node.features
            .map(item =>
                `<li>${item.replace(/\n/g,"<br>&emsp;")}</li>`
            )
            .join("");

// details全体
    return `

        <details>

            <summary>
                言語的特徴（詳細）
            </summary>

            <ul class="feature-list">

                ${featureHTML}

            </ul>

        </details>

    `;

}

// =======================================
// 分類に関する議論
// =======================================
function buildClassificationSection(node){    

    // 議論が存在するか
    const hasControversial =
        node.controversial === true ||
        node.controversial === "true";

    if(!hasControversial){
        return "";
    }

// <li>を作る
    const classificationHTML =
        node.classification_notes
            .split("\n")
            .map(p => `<p>${p}</p>`)
            .join("");

// details全体
    return `

         <details>

            <summary>
                分類に関する議論
            </summary>


            <div class="classification-note">

            ${classificationHTML}

            </div>

        </details>

    `;

}

// =======================================
// Wikipediaリンク生成
// =======================================

function buildWikipediaSection(node){

    const links = [];


    // 日本語版
    if(node.wikipedia_ja){

        links.push(`
            <a href="${node.wikipedia_ja}" target="_blank">
                Wikipedia（日本語版）で見る
            </a>
        `);

    }


    // 英語版
    if(node.wikipedia_en){

        links.push(`
            <a href="${node.wikipedia_en}" target="_blank">
                Read on Wikipedia (en)
            </a>
        `);

    }


    // どちらもない場合
    if(links.length === 0){

        return "";

    }


    return `

        <div class="wikipedia-links">

            ${links.join("<br>")}

        </div>

    `;

}

// =====================================================
// 言語カードを作る関数
// nodeはツリー上で選択されたJSONデータ
// =====================================================

function buildLanguageCard(node){

    const breadcrumb =
        buildBreadcrumb(node);

    const featureSection =
        buildFeatureSection(node);

    const classificationSection =
        buildClassificationSection(node);
    
    const wikipediaSection =
    buildWikipediaSection(node);


    return `

        <div class="breadcrumb">

            ${breadcrumb}

        </div>

        <img class="flag"
             src="${node.flag_image ?? ""}">


        <h1>

            ${node.name}

            ${
                node.code
                ? `<span class="code">${node.code ?? ""}</span>`
                : ""
            }

        </h1>


        <div class="native">

            ${node.native_name ?? ""}

        </div>



        <div class="ipa">

            ${node.ipa ?? ""}

        </div>



        <p>

            ${node.summary ?? ""}

        </p>



        <hr>



        <table>


            <tr>

                <th>系統</th>

                <td>
                ${node.classification ?? ""}
                </td>

            </tr>


            <tr>

                <th>文字</th>

                <td>
                ${node.script ?? ""}
                </td>

            </tr>


            <tr>

                <th>話者数</th>

                <td>
                ${node.speakers ?? ""}
                </td>

            </tr>


            <tr>

                <th>分布</th>

                <td>
                ${node.distribution ?? ""}
                </td>

            </tr>


        </table>



        ${featureSection}



        ${classificationSection}



        ${wikipediaSection}



    `;

}

// =====================================================
// 言語カードを表示する関数
// nodeはツリー上で選択されたJSONデータ
// =====================================================

function showCard(node){

    // カード表示場所を取得

    const card =
        document.getElementById("card");

    const modal =
        document.getElementById("modal");


    // カード生成

    card.innerHTML =
        buildLanguageCard(node);
    
    const closeButton =
        document.createElement("span");

    closeButton.id = "close-button";
    closeButton.textContent = "×";

    closeButton.addEventListener(
        "click",
        (event)=>{
            event.stopPropagation();
            closeCard();
        }
    );

    card.appendChild(closeButton);

    
    modal.style.display="flex";

    document
    .getElementById("tree")
    .classList.add("blur");

    
    // パンくずクリックイベント
    document
    .querySelectorAll(".breadcrumb-link")
    .forEach(element=>{


        element.addEventListener(
            "click",
            ()=>{


                const target =
                nodeMap[element.dataset.node];


                showCard(target);


            }
        );


    });


}

document
.getElementById("modal")
.addEventListener("click",(event)=>{


    if(event.target.id==="modal"){

        closeCard();

    }

});

document
.getElementById("modal-close")
.addEventListener("click",()=>{

    closeCard();

});

document.addEventListener("keydown",(event)=>{

    if(event.key==="Escape"){

        closeCard();

    }

});


function closeCard(){

    document
    .getElementById("modal")
    .style.display="none";


    document
    .getElementById("tree")
    .classList.remove("blur");

}