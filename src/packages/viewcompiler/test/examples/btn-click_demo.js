const state = new Backside.Model({
  isContentOpened: false,
});

const _unbind = state.listen({
  toggleContentBtnClick: (e, state_o) => {
    state_o.change('isContentOpened', !state_o.get('isContentOpened'));
  },
  nextBtnClick: () => {
    console.log('Hello friend');
  },
});

const cleaningTree = viewcompiler(document.body, state);
