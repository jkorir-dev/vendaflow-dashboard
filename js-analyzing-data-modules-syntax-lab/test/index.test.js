const {
  combineUsers
  } = require('../index');
  require('datejs');

  describe('combineUsers function return', () => {
    const combine = combineUsers(["Jim3","Pam5","Dwight77"],["Michael6","Eleanor22","Chidi202"],["Jack_jack","Julia_Oreo", "Bill_bore"])
    
    
    test('should be an object', () => {
      expect(typeof combine).toBe('object');
    });
    test('should have the properties users and merge_date', () => {
      expect(combine).toHaveProperty('users');
      expect(combine).toHaveProperty('merge_date');
    });
  });
  describe('combineUsers function', () => {
    const combine = combineUsers(["Jim3","Pam5","Dwight77"],["Michael6","Eleanor22","Chidi202"],["Jack_jack","Julia_Oreo", "Bill_bore"])
    const combine2 = combineUsers(["test1"],["test2"])
    const combine3 = combineUsers([])
    
    test('should merge all given arrays', () => {
      expect(combine.users).toStrictEqual(["Jim3","Pam5","Dwight77","Michael6","Eleanor22","Chidi202","Jack_jack","Julia_Oreo", "Bill_bore"]);
      expect(combine2.users).toStrictEqual(["test1","test2"])
      expect(combine3.users).toStrictEqual([])
    });

    test('should contain todays date', () => {
      expect(combine.merge_date).toBe(Date.today().toString("M/d/yyyy"))
      expect(combine2.merge_date).toBe(Date.today().toString("M/d/yyyy"))
    });
    
  })
  