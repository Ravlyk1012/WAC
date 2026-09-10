// =====================================================
// WAC Prototype 2.0　D3.js導入
// JSONデータから系統ツリーを自動生成する
// =====================================================
// console.log("★★★ WAC DEBUG 最新版 ★★★");

// 読み込んだ全ノードを保存する場所

const nodes = [];

// node_key → JSON を高速検索する辞書
const nodeMap = {};

// ページ読み込み時

window.addEventListener(
"DOMContentLoaded",
async()=>{

    // ============================
    // 一覧JSON取得
    // ============================

    const list =
        await fetch("data/language.json");

    const listData =
        await list.json();


    // ============================
    // 全JSONを並列読み込み
    // ============================

    console.time("JSON読み込み");

    const dataList =
        await Promise.all(

            listData.languages.map(
                async file => {

                    console.log("読み込み開始:", file);

                    const res =
                        await fetch(`data/${file}`);

                    const data =
                        await res.json();

                    console.log(
                        "読み込み成功:",
                        file
                    );

                    return data;

                }
            )

        );

    console.timeEnd("JSON読み込み");

    // ============================
    // nodes / nodeMap に登録
    // ============================

    dataList.forEach(data => {

        nodes.push(data);

        nodeMap[data.node_key] = data;

    });


    // ============================
    // 全JSON読み込み後に親ノード確認
    // ============================

    for (const node of nodes) {

        if (
            node.parent &&
            !nodeMap[node.parent]
        ) {

            console.error(
                `親ノード不存在: ${node.name} -> ${node.parent}`
            );

        }

    }


    // ============================
    // ルートノード表示
    // ============================

    const tree =
        document.getElementById("tree");


    console.log("JSON全部読み込み完了");
    console.log("nodes:", nodes.length);

    console.log(
        "root:",
        nodes.filter(n => !n.parent)
    );

    console.log("tree:", tree);

    console.time("ツリー生成");

    nodes
    .filter(n => !n.parent)
    .forEach(root => {

        console.log(
            "ルート生成開始:",
            root
        );

        tree.appendChild(
            createNode(root, true)
        );

        console.log(
            "ルート生成完了:",
            root
        );

    });

    console.timeEnd("ツリー生成");

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
    
    children.sort((a, b) => {
        const orderA = a.display_order ?? 9999;
        const orderB = b.display_order ?? 9999;
        return orderA - orderB;
    });

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

    // ブラウザ履歴にカード表示状態を追加
    if (!history.state || !history.state.cardOpen) {

        history.pushState(
            { cardOpen: true },
            "",
            location.href
        );

    }

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



document.addEventListener("keydown",(event)=>{

    if(event.key==="Escape"){

        closeCard();

    }

});

window.addEventListener("popstate", ()=>{

    const modal =
        document.getElementById("modal");

    if(modal.style.display === "flex"){

        closeCard(true);

    }

});


function closeCard(fromHistory = false){

    document
    .getElementById("modal")
    .style.display="none";


    document
    .getElementById("tree")
    .classList.remove("blur");

    if(!fromHistory &&
       history.state &&
       history.state.cardOpen){

        history.back();

    }

}


// =====================================================
// D3.js 実験
// =====================================================

const d3Data = {
    name: "Indo-European",
    children: [
        { name: "Slavic" },
        { name: "Germanic" },
        { name: "Romance" },
        { name: "Celtic" },
        { name: "Baltic" }
    ]
};

const width = 800;
const height = 600;

const rootX = width / 2;
const rootY = height / 2;


/* ==============================
   SVG
============================== */

const svg =
    d3.select("#d3-tree")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

const tooltip =
    svg.append("g")
       .attr("class", "tooltip")
       .style("display", "none");

tooltip
    .append("line")
    .attr("class", "tooltip-line");

tooltip
    .append("rect")
    .attr("class", "tooltip-box")
    .attr("width", 160)
    .attr("height", 70)
    .attr("rx", 8);

tooltip
    .append("text")
    .attr("class", "tooltip-title")
    .attr("x", 15)
    .attr("y", 25);

tooltip
    .append("text")
    .attr("class", "tooltip-description")
    .attr("x", 15)
    .attr("y", 48)
    .text("Test information");


/* ==============================
   ノードデータ
============================== */

const rootNode = {
    id: "root",
    name: d3Data.name,
    x: rootX,
    y: rootY,
    fx: rootX,
    fy: rootY
};

const childNodes =
    d3Data.children.map((child, index) => {

        const angle =
            (index / d3Data.children.length)
            * Math.PI * 2;

        return {
            ...child,
            id: `child-${index}`,
            x:
                rootX +
                Math.cos(angle) * 150,
            y:
                rootY +
                Math.sin(angle) * 150
        };

    });

const simulationNodes = [
    rootNode,
    ...childNodes
];

const links =
    childNodes.map(child => ({
        source: rootNode,
        target: child
    }));


/* ==============================
   線
============================== */

const linkSelection =
    svg.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link");


/* ==============================
   中央ノード
============================== */

const rootGroup =
    svg.append("g")
        .attr("class", "root-group");

rootGroup
    .append("circle")
    .attr("class", "root")
    .attr("r", 30);

rootGroup
    .append("text")
    .attr("class", "node-text root-text")
    .attr("text-anchor", "middle")
    .attr("dy", 50)
    .text(rootNode.name);


/* ==============================
   子ノード
============================== */

const childSelection =
    svg.selectAll(".child")
        .data(childNodes)
        .enter()
        .append("g")
        .attr("class", "child");

childSelection
    .append("circle")
    .attr("class", "child-circle")
    .attr("r", 18);

childSelection
    .append("text")
    .attr("class", "node-text")
    .attr("text-anchor", "middle")
    .attr("dy", 38)
    .text(d => d.name);

childSelection
    .on("mouseenter", function(event, d) {

        d.fx = d.x;
        d.fy = d.y;

        d.floatStopped = true;

        console.log("Hover:", d.name);

        tooltip
            .style("display", null);

        tooltip
            .select(".tooltip-title")
            .text(d.name);

        tooltip
            .attr(
                "transform",
                `translate(${d.x + 40},${d.y - 35})`
            );
        tooltip
            .select(".tooltip-line")
            .attr("x1", -40)
            .attr("y1", 35)
            .attr("x2", 0)
            .attr("y2", 35);

    })
    .on("click", function(event, d) {

        event.stopPropagation();

        console.log("Click:", d.name);

        rootNode.name = d.name;

        rootGroup
            .select(".root-text")
            .text(rootNode.name);

    });

/* ==============================
   Force Simulation
============================== */

const simulation =
    d3.forceSimulation(simulationNodes)
        .alphaDecay(0.002)

        .force(
            "link",
            d3.forceLink(links)
                .distance(150)
                .strength(0.4)
        )

        .force(
            "charge",
            d3.forceManyBody()
                .strength(-80)
        )

        .force(
            "collide",
            d3.forceCollide()
                .radius(30)
        )

        .force(
            "radial",
            d3.forceRadial(
                150,
                rootX,
                rootY
            )
            .strength(0.2)
        )

        .on("tick", () => {

            linkSelection
                .attr("x1", rootX)
                .attr("y1", rootY)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            childSelection
                .attr(
                    "transform",
                    d => `translate(${d.x},${d.y})`
                );

            rootGroup
                .attr(
                    "transform",
                    `translate(${rootX},${rootY})`
                );

        });

function floatNodes() {

    childNodes.forEach((node, index) => {

        node.floatAngle =
            (node.floatAngle ?? 0)
            + 0.002;

        node.floatX =
            Math.cos(node.floatAngle + index)
            * 15;

        node.floatY =
            Math.sin(node.floatAngle * 1.3 + index)
            * 15;

    });

    childSelection
        .attr(
            "transform",
            d => {

                if (d.floatStopped) {
                    return `translate(${d.x},${d.y})`;
                }

                return `translate(
                    ${d.x + d.floatX},
                    ${d.y + d.floatY}
                )`;
            }
        );

    linkSelection
        .attr("x1", rootX)
        .attr("y1", rootY)
        .attr(
            "x2",
            d => d.target.x + d.target.floatX
        )
        .attr(
            "y2",
            d => d.target.y + d.target.floatY
        );

    requestAnimationFrame(floatNodes);
}

floatNodes();