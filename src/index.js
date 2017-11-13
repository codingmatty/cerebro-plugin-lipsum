'use strict';
const fs = require('fs');
const qs = require('qs');
const path = require('path');
const icon = require('./LipsumIcon.png');


let lastChoice = 'Words';

const plugin = ({term, display, actions}) => {
  const match = /lipsum\s(.*)/.exec(term);
  if (match) {
    const args = match[1];
    const opts = {};
    args.split(' ').forEach((arg) => {
      const possibleKeywords = ['words', 'paragraphs', 'bytes', 'lists'].filter((word) => {
        return word.startsWith(arg.toLowerCase());
      });
      if (possibleKeywords.length === 1) {
        const [keyword] = possibleKeywords;
        opts.what = `${keyword[0].toUpperCase()}${keyword.toLowerCase().slice(1)}`;
      } else if (!Number.isNaN(parseFloat(arg))) {
        opts.amount = arg;
      } else if ('start'.startsWith(arg.toLowerCase())) {
        opts.start = true;
      }
    });

    const list = getList(actions, opts).filter(({ title }) => {
      return !opts.what || title === opts.what;
    }).map((displayItem) => {
      return {
        icon,
        title: displayItem.title,
        subtitle: `Generate lorem ipsum ${displayItem.title.toLowerCase()} from http://www.lipsum.com`,
        onSelect: generateOnSelect(actions, displayItem.title, opts)
      };
    });
    display(list);
  }
};

module.exports = {
  fn: plugin,
  keyword: 'lipsum',
  name: 'Generate Lorem Ipsum Text'
}

function getList(actions, opts) {
  return [
    { title: 'Words' },
    { title: 'Paragraphs' },
    { title: 'Bytes' },
    { title: 'List' }
  ].sort(({ title: firstTitle }, { title: secondTitle }) => {
    // prioritize the last chosen option, otherwise list alphabetically.
    if (firstTitle === lastChoice || firstTitle < secondTitle) {
      return -1;
    } else if (secondTitle === lastChoice || secondTitle < firstTitle) {
      return 1;
    }
    return 0;
  });
}

function generateOnSelect(actions, title, opts) {
  const what = title === 'Paragraphs' ? 'paras' : title.toLowerCase();
  return () => fetchLoremIpsum(what, opts.amount, opts.start).then(({ text, description }) => {
    lastChoice = title;
    actions.copyToClipboard(text);
    new Notification('Text Copied', {
      body: description
    });
  });
}

function fetchLoremIpsum(what, amount, start = false) {
  const query = qs.stringify({
    what,
    amount,
    start: start ? 'yes' : 'no'
  });

  return fetch(`http://www.lipsum.com/feed/json?${query}`)
    .then((res) => res.json())
    .then(({ feed }) => {
      return {
        text: feed.lipsum,
        description: feed.generated
      }
    });
}
