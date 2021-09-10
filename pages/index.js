import dynamic from "next/dynamic";
import { useEffect, useState, useRef, useReducer } from "react";
import styles from "../styles/Snake.module.css";

const Config = {
  height: 25,
  width: 25,
  cellSize: 32,
};

const CellType = {
  Snake: "snake",
  Food: "food",
  Empty: "empty",
};

const Direction = {
  Left: { x: -1, y: 0 },
  Right: { x: 1, y: 0 },
  Top: { x: 0, y: -1 },
  Bottom: { x: 0, y: 1 },
};

const Cell = ({ x, y, type }) => {
  const getStyles = () => {
    switch (type) {
      case CellType.Snake:
        return {
          backgroundColor: "yellowgreen",
          borderRadius: 8,
        };

      case CellType.Food:
        return {
          backgroundColor: "darkorange",
          borderRadius: 20,
        };

      default:
        return {};
    }
  };
  return (
    <div
      className={styles.cellContainer}
      style={{
        left: x * Config.cellSize,
        top: y * Config.cellSize,
        width: Config.cellSize,
        height: Config.cellSize,
      }}
    >
      <div className={styles.cell} style={getStyles()}></div>
    </div>
  );
};

const getRandomCell = () => ({
  x: Math.floor(Math.random() * Config.width),
  y: 10,
});

const Snake = () => {
  const getDefaultSnake = () => [
    { x: 8, y: 12 },
    { x: 7, y: 12 },
    { x: 6, y: 12 },
  ];
  const grid = useRef();

  // snake[0] is head and snake[snake.length - 1] is tail
  const [snake, setSnake] = useState(getDefaultSnake());
  // const [direction, setDirection] = useState(Direction.Right);

  const [food, setFood] = useState({ x: 4, y: 10 });
  // const [score, setScore] = useState(0);
  
  const gameProp = {
    score: 0, 
    direction: Direction.Right,
  }
  const reducer = (state, action)=>{
    switch(action.type){
      case 'score':
        console.log(action)
        return {...state, score: state.score + 1}
      case 'direction':
        console.log(action)
        if(possibleMove(state.direction, action.dir)){
          return {...state, direction:action.dir}
        }
        return state
      default:
        return state
    }
  }
  const possibleMove = (prevDirection, newDirection) =>{
    if(
      (prevDirection === Direction.Top && newDirection === Direction.Bottom) ||
      (prevDirection === Direction.Bottom && newDirection === Direction.Top) ||
      (prevDirection === Direction.Left && newDirection === Direction.Right) ||
      (prevDirection === Direction.Right && newDirection === Direction.Left)
      ){
      return false;
    }
    return true;
  }
  const[gameController, gamePropDispatch] = useReducer(reducer, gameProp)
  
    // update score whenever head touches a food
    useEffect(() => {
      console.log("Snake changed")
      const head = snake[0];
      if (isFood(head)) {
        // setScore((score) => {
        //   return score + 1;
        // });
        
        gamePropDispatch({type:'score'})
  
        let newFood = getRandomCell();
        while (isSnake(newFood)) {
          newFood = getRandomCell();
        }
  
        setFood(newFood);
      }
      else{
        snake.pop();
      }
    }, [snake]);
  

  // move the snake
  useEffect(() => {
    console.log(gameController)
    const runSingleStep = () => {
      setSnake((snake) => {
        const head = snake[0];
        const newHead = { 
          x: (head.x + gameController.direction.x) % Config.width, 
          y: (head.y + gameController.direction.y) % Config.height 
        };
        // handling negative value of x and y
        if(newHead.x < 0){
          newHead.x = newHead.x + Config.width;
        }
        if(newHead.y < 0){
          newHead.y = newHead.y + Config.height;
        }
        // make a new snake by extending head
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
        const newSnake = [newHead, ...snake];

        // remove tail
        // newSnake.pop();

        return newSnake;
      });
    };

    runSingleStep();
    const timer = setInterval(runSingleStep, 500);

    return () => clearInterval(timer);
  }, [gameController, food]);


  useEffect(() => {
    const handleNavigation = (event) => {
      switch (event.key) {
        // To allow the snake to change direction only at right angles,
        // we have to set the direction based on previous state
        case "ArrowUp":
          gamePropDispatch({type:'direction', dir:Direction.Top})
          break;

        case "ArrowDown":
          gamePropDispatch({type:'direction', dir:Direction.Bottom})
          break;

        case "ArrowLeft":
          gamePropDispatch({type:'direction', dir:Direction.Left})
          break;

        case "ArrowRight":
          gamePropDispatch({type:'direction', dir:Direction.Right})
          break;
      }
    };
    window.addEventListener("keydown", handleNavigation);

    return () => window.removeEventListener("keydown", handleNavigation);
  }, []);

  // ?. is called optional chaining
  // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
  const isFood = ({ x, y }) => food?.x === x && food?.y === y;

  const isSnake = ({ x, y }) =>
    snake.find((position) => position.x === x && position.y === y);

  const cells = [];
  for (let x = 0; x < Config.width; x++) {
    for (let y = 0; y < Config.height; y++) {
      let type = CellType.Empty;
      if (isFood({ x, y })) {
        type = CellType.Food;
      } else if (isSnake({ x, y })) {
        type = CellType.Snake;
      }
      cells.push(<Cell key={`${x}-${y}`} x={x} y={y} type={type} />);
    }
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        style={{ width: Config.width * Config.cellSize }}
      >
        Score: {gameController.score}
      </div>
      <div
        className={styles.grid}
        style={{
          height: Config.height * Config.cellSize,
          width: Config.width * Config.cellSize,
        }}
      >
        {cells}
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Snake), {
  ssr: false,
});
