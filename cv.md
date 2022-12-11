# RS School CV
1. Fullname:  Sivakov JR Dos Santos Aveiro 

2. Contacts:
* email | sivakovjr@gmail.com
* instagram | instagram.com/sivakovjr
* telegram | @sivakovjr
3. Summary
* I've been playing soccer for more than 10 years and I'm so passionate about this.
* I want to start my career as a JS developer in the nearest future
* I'm into learning, playing CS:GO, hanging out with my friends and enjoying life
* I tend to try something new across my whole life
* I'm a sociable person and I strongly think that communication can help to reach out your goals and it can help in difficult times and that's why I have an advantage over the others
* I'm a fast learner and I'm not shy and I'm able to ask any dumb question
4. Skills
* *HTML*
* *CSS*
* *Git* - basics
* *Javascript* - essentials
5. Code examples  
```javascript
    const points = (games) => {
      return games.map(m => m.split(':').map(m => +m)).map(([a, b]) => {
        if (a === b) return 1;
        if (a > b) return 3;
        return 0;
      }).reduce((totalPoints, matchPoints) => totalPoints += matchPoints, 0)
    }
```