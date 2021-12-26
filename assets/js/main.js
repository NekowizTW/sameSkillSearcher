//  ref: https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-and-arrays-by-string-path
Object.byString = function(o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
}

function genHead (filename) {
    const randKey = Math.round(Math.random() * 4) + 1;
    const md5 = CryptoJS.MD5(filename).toString();
    const img = document.createElement('img');

    img.src = `http://vignette${randKey}.wikia.nocookie.net/nekowiz/images/${md5.charAt(0)}/${md5.charAt(0)}${md5.charAt(1)}/${filename}/revision/latest?path-prefix=zh`;
    return img;
}

const ordering = ['EXASData.info', 'ss2Data.info', 'as2Data.info', 'prop', 'prop2', 'id'];
function arrOrder (lhs, rhs, idx = 0) {
    const lstr = Object.byString(lhs, ordering[idx]) || '-',
          rstr = Object.byString(rhs, ordering[idx]) || '-';
    if (lstr === rstr)
        return arrOrder(lhs, rhs, idx + 1);
    else
        return lstr.localeCompare(rstr);
}
const container = document.getElementById('container');
const select = document.getElementById('categorySelect');
const names = ['頭像', '精靈名', 'AS', 'SS', 'EXAS'];
const access = ['small_filename', 'name', 'as2Data.info', 'ss2Data.info', 'EXASData.info'];
let data;

function generateTable (name, arr) {
    const group = document.createElement('div');
    group.classList.add('pure-g');
    const title = document.createElement('h3');
    title.classList.add('pure-u-1');
    title.innerHTML = `AS: ${name.split('-')[0]}<br>SS: ${name.split('-')[1]}`;

    const table = document.createElement('table');
    table.classList.add('pure-table', 'pure-table-striped', 'pure-u-1');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const thr = document.createElement('tr');
    names.forEach(name => {
        const th = document.createElement('th');
        th.innerHTML = `${name}`;
        thr.appendChild(th);
    });
    thead.appendChild(thr);

    arr.sort(arrOrder);

    arr.forEach(card => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', card.id);

        access.forEach(ptr => {
            const td = document.createElement('td');
            const content = Object.byString(card, ptr);

            if (ptr === 'small_filename')
                td.appendChild(genHead(content));
            else if (ptr === 'name')
                td.innerHTML = `<a href="https://nekowiztw.github.io/cardFinder/#/card/${card.id}" target="_blank">${content}</a>`;
            else
                td.innerHTML = `${content !== undefined ? content : '-'}`;

            if (ptr === 'name' && card.obtainType && card.obtainType.type === 'haifu')
                td.innerHTML += `<span class="haifu">配</span>`;
            if (ptr === 'name' && card.id.split('-')[0].length > 5)
                td.innerHTML += `<span class="tw">台</span>`;
            tr.appendChild(td);
        })

        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);

    group.appendChild(title);
    group.appendChild(table);
    return group;
}

async function init () {
    const source = await fetch('https://nekowiztw.github.io/cardFinder/json/cardData.json').then(response => response.json());

    const grouped = _.groupBy(source.card, card => `${card.as2Data.type}-${card.ss2Data.type}`);

    const mapped = Object.keys(grouped).map(key => {
        const lastEvos = grouped[key].filter(card => !(card.evo_to));
        return [key, lastEvos.length, lastEvos];
    });

    const filted = mapped.filter(group => group[1] > 1 && group[1] < 10000);

    data = filted;

    // data = await fetch('./sameSkill.json').then(response => response.json());

    data = data.sort((lhs, rhs) => lhs[0].localeCompare(rhs[0]));

    document.querySelector('label[for="categorySelect"]').innerHTML = `已載入${data.length}種組合，選擇一個組合來顯示表格。`;

    // data.forEach((item, idx) => {
    //     const option = document.createElement('option');
    //     option.innerHTML = `${item[0].replace('-', ' | ')} - 共${item[1]}個`;
    //     option.value = idx;
    //     select.appendChild(option);
    // });

    new TomSelect('#categorySelect', {
        options: data.map((item, idx) => ({value: idx, text: item[0].replace('-', ' | '), title: item[0].replace('-', ' | '), cnt: item[1]})),
        maxOptions: 1000,
        render: {
            option: (data) => {
                return `<div><span class="title">${data.title}</span><span class="cnt">共${data.cnt}張</span></div>`
            },
            item: (data) => {
                return `<span>${data.title}</span>`;
            }
        },
        onChange: (value) => {
            const idx = parseInt(value);
            if (!Number.isInteger(idx)) return;
            if (idx === -1 || idx >= data.length) return;
        
            container.innerHTML = ``;
            const group = generateTable(data[idx][0], data[idx][2]);
            container.appendChild(group);
        }
    });
}


init();