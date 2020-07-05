const {groupArguments} = require('../src/utils');

test('tt', () => {
  const options = '-i "./path" -a "./path1" -a 2 -o "./path3" -r "./path4" -v'.split(' ');
  expect(groupArguments(options)).toEqual({
    i: ['./path'],
    a: ['./path1', '2'],
    o: ['./path3'],
    r: ['./path4'],
    v: []
  });
});
