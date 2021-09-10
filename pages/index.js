import dynamic from "next/dynamic";
import { useEffect, useState, useRef, useReducer } from "react";
import styles from "../styles/Snake.module.css";

const Config = {
  height: 25,
  width: 10,
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
  y: Math.floor(Math.random() * Config.height),
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
  const [direction, setDirection] = useState(Direction.Right);

  // const [food, setFood] = useState({ x: 4, y: 10 });
  const [score, setScore] = useState(0);


  const initialFoods = [
    {x : 5, y: 4, time:Date.now()}
  ]
  const[foods, setFoods] = useState(initialFoods)

  const[last, setLast] = useState({x : -1, y: -1})

    // update score whenever head touches a food
    useEffect(() => {
      const head = snake[0];
      if(isCollide(head)){
        console.log("Possibility to collide")
        setSnake(getDefaultSnake());
        setScore(0);
        setDirection(Direction.Right)
        setFoods(initialFoods)
        return;
      }
      if (isFood(head)) {
        setScore((prevScore) => {
          return prevScore + 1;
        });
        setFoods(prevFoods => prevFoods.filter(item => item.x !== head.x && item.y !== head.y ))
        const newSnake = [...snake, last]
        setSnake(prevSnake => newSnake)
      }
      else{
        // snake.pop();
      }
    }, [snake]);
  

  // move the snake
  useEffect(() => {
    const runSingleStep = () => {
      setSnake((snake) => {
        const head = snake[0];
        const newHead = { 
          x: (head.x + direction.x) % Config.width, 
          y: (head.y + direction.y) % Config.height 
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
        setLast(newSnake.pop());

        return newSnake;
      });
    };

    runSingleStep();
    const timer = setInterval(runSingleStep, 500);

    return () => clearInterval(timer);
  }, [direction]);


  useEffect(() => {
    const handleNavigation = (event) => {
      switch (event.key) {
        // To allow the snake to change direction only at right angles,
        // we have to set the direction based on previous state
        case "ArrowUp":
          setDirection((prevDirection) =>{
            if(prevDirection === Direction.Bottom){
              return Direction.Bottom;
            }
            return Direction.Top;
          })
          break;

        case "ArrowDown":
          setDirection((prevDirection) =>{
            if(prevDirection === Direction.Top){
              return Direction.Top;
            }
            return Direction.Bottom;
          })
          break;

        case "ArrowLeft":
          setDirection((prevDirection) =>{
            if(prevDirection === Direction.Right){
              return Direction.Right;
            }
            return Direction.Left;
          })
          break;

        case "ArrowRight":
          setDirection((prevDirection) =>{
            if(prevDirection === Direction.Left){
              return Direction.Left;
            }
            return Direction.Right;
          })
          break;
      }
    };
    window.addEventListener("keydown", handleNavigation);

    return () => window.removeEventListener("keydown", handleNavigation);
  }, []);


  useEffect(() =>{
    const addFoodInterval = setInterval(()=>{
      setFoods((prevFoods) =>{
        const newFood = getFood()
        return [...prevFoods, newFood]
      })
    }, 3000)

    return () => clearInterval(addFoodInterval)

  }, [])

  useEffect(() =>{

    const removeFoodInterval = setInterval(()=>{
      setFoods(prevFoods => prevFoods.filter(item => Date.now() - item.time < 10000 ))
    }, 1000)

    return () => clearInterval(removeFoodInterval)

  }, [])

  // ?. is called optional chaining
  // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
  // const isFood = ({ x, y }) => food?.x === x && food?.y === y;

  const isFood = ({ x, y }) => 
    foods.find((food) => food.x === x && food.y === y)

  const isSnake = ({ x, y }) =>
    snake.find((position) => position.x === x && position.y === y);

  const getIndexOf = (snake, head) =>{
    for(let i = 1; i < snake.length; i++){
      const position = snake[i];
      if(position.x === head.x && position.y === head.y){
        return i;
      }
    }
    return -1;
  }

  const isCollide = (head) =>{
      const idx = getIndexOf(snake, head)
      if(idx === -1){
        return false
      }
      return true
  }

  const getFood = () => {
    let newFood = getRandomCell();
    while (isSnake(newFood) || isFood(newFood)) {
      newFood = getRandomCell();
    }
    return {x : newFood.x, y:newFood.y, time:Date.now()}
  }

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
        Score: {score}
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
