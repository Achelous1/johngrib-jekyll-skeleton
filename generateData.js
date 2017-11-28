#!/usr/bin/env node

const fs = require('fs');
const path = './_wiki'
const list = [];
const dataMap = {};

getFiles('./_wiki', 'wiki', list);
getFiles('./_posts', 'blog', list);

const dataList = list.map(function collectData(file) {

    const data = fs.readFileSync(file.path, 'utf8');
    return parseInfo(file, data.split('---')[1]);

}).filter(function removeNullData(row) {

    return row != null;

}).sort(function sortByFileName(a, b) {

    return a.fileName.toLowerCase().localeCompare(b.fileName.toLowerCase());

});

dataList.forEach(function collectMap(data) {
    dataMap[data.fileName] = data;
});
saveWikiMap(dataMap);


const tagMap = {};

dataList.forEach(function collectTagMap(data) {
    if(!data.tags) {
        return;
    }
    data.tags.forEach(function(tag) {
        if(!tagMap[tag]) {
            tagMap[tag] = [];
        }
        tagMap[tag].push(data);
    });
});

for(tag in tagMap) {
    tagMap[tag].sort(function sortByModifiedDateTime(a, b) {
        return a.modified < b.modified;
    });
}
saveTagMap(tagMap);


const tagList = Object.keys(tagMap).sort(function sortByTagName(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
});

saveTagList(tagList)

const pageList = dataList.sort(function(a, b) {
    return a.modified < b.modified;
});

savePageList(pageList);

function saveWikiMap(dataMap) {
    fs.writeFile("./_data/wikiMap.json", JSON.stringify(dataMap), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("wikiMap saved.");
    });
}

function saveTagMap(tagMap) {
    fs.writeFile("./_data/tagMap.json", JSON.stringify(tagMap), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("tagMap saved.");
    });
}

function saveTagList(tagList) {
    fs.writeFile("./_data/tagList.json", JSON.stringify(tagList), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("tagList saved.");
    });
}

function savePageList(pageList) {
    fs.writeFile("./_data/pageList.json", JSON.stringify(pageList), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("pageList saved.");
    });
}

function parseInfo(file, info) {
    if(info == null) {
        return undefined;
    }
    const obj = {};
    obj.fileName = file.name.replace(/\.md$/, '');
    obj.type = file.type;

    const rawData = info.split('\n');

    rawData.forEach(function(str) {
        const result = /^\s*([^:]+):\s*(.+)\s*$/.exec(str);

        if(result == null) {
            return;
        }

        const key = result[1].trim();
        const val = result[2].trim();

        obj[key] = val;
    });

    if(file.type === 'blog') {
        obj.url = '/blog/' + obj.date.replace(/^(\d{4})-(\d{2})-(\d{2}).*$/, '$1/$2/$3/');
        obj.url += obj.fileName.replace(/^(\d{4}-\d{2}-\d{2}-)?(.*)$/, '$2');
    } else if(file.type === 'wiki') {
        obj.url = '/wiki/' + obj.fileName;
    }

    if(obj.tags) {
        obj.tags = obj.tags.split(/\s+/);
    }

    const mtime = fs.statSync(file.path).mtime;
    obj.modified = mtime;

    return obj;
}

function isDirectory(path) {
    return fs.lstatSync(path).isDirectory();
}

function isMarkdown(fileName) {
    return /\.md$/.test(fileName);
}

function getFiles(path, type, array){

    fs.readdirSync(path).forEach(function(fileName){

        const subPath = path + '/' + fileName;

        if(isDirectory(subPath)) {
            return getFiles(subPath, type, array);
        }
        if(isMarkdown(fileName)) {
            const obj = {
                'path': path + '/' + fileName,
                'type': type,
                'name': fileName,
            };
            return array.push(obj);
        }
    });
}
