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
  y: Math.floor(Math.random() * Config.height),
});

const Snake = () => {
  const getDefaultSnake = () => [
    { x: 8, y: 12 },
    { x: 7, y: 12 },
    { x: 6, y: 12 },
  ];

  const INITIAL_FOODS = [
    {x : 5, y: 4, time:Date.now()}
  ]

  const INITIAL_DIRECTION = Direction.Right;
  const INITIAL_SCORE = 0;
  const FOOD_ADD_TIME_INTERVAL = 3000;
  const FOOD_REMOVE_TIME_INTERVAL = 10000;
  const SCORE_INCREMENT = 1;
  const SNAKE_SPEED = 500; // 500 ms

  const grid = useRef();

  // set up the initial game properties.
  // snake[0] is head and snake[snake.length - 1] is tail
  const [snake, setSnake] = useState(getDefaultSnake());
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [score, setScore] = useState(INITIAL_SCORE);
  const[foods, setFoods] = useState(INITIAL_FOODS)
  const[lastRemovedTail, setLastRemovedTail] = useState({x : -1, y: -1})

  // sets the neccessary behaviours when restarts the game.
  const restartGame = () =>{
    setSnake(getDefaultSnake());
    setScore(INITIAL_SCORE);
    setDirection(INITIAL_DIRECTION)
    setFoods(INITIAL_FOODS)
  }
    // update score whenever head touches a food
    useEffect(() => {
      const head = snake[0];
      // Handling snake collision (When the snake touches itself).
      // If any collision happen, it restarts the game.
      if(isCollide(head)){
        restartGame()
        return;
      }
      // Handling food eating behavior of the snake.
      // If the snake eats a food, increments score, removes eating food from the grid,
      // increase the snake size by one(it can be achieved by 
      // adding the last removed tail element)
      if (isFood(head)) {
        setScore((prevScore) => {
          return prevScore + SCORE_INCREMENT;
        });
        setFoods(prevFoods => prevFoods.filter(item => item.x !== head.x && item.y !== head.y ))
        const newSnake = [...snake, lastRemovedTail]
        setSnake(prevSnake => newSnake)
      }
    }, [snake]);
  

  // move the snake
  useEffect(() => {
    const runSingleStep = () => {
      setSnake((snake) => {
        const head = snake[0];
        // Calculate the new head for next move of the snake.
        // Also make the snake reappear from the opposite direction when 
        // it crosses the grid boundary.(Calculate modulus of x and y) 
        // Adding Config property(width or height) for handling negative 
        // value(snake moving left or up).
        const newHead = { 
          x: (head.x + direction.x + Config.width) % Config.width, 
          y: (head.y + direction.y + Config.height) % Config.height 
        };
        // make a new snake by extending head
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
        const newSnake = [newHead, ...snake];

        // removing the tail to make the snake move forward.
        let tail = newSnake.pop();
        // store the tail for future use to increase the snake size when it eats food.
        setLastRemovedTail(tail);

        return newSnake;
      });
    };

    runSingleStep();
    const timer = setInterval(runSingleStep, SNAKE_SPEED);

    return () => clearInterval(timer);
  }, [direction]);


  // Setting key event(arrow key) for moving the snake in the grid.
  // Four type of moving -> left, right, up and down. Each type of move
  // can be achieved by pressing respective arrow key.
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

  // setting an interval to add food.
  // Adding food every FOOD_ADD_TIME_INTERVAL time.
  useEffect(() =>{
    const addFoodInterval = setInterval(()=>{
      setFoods((prevFoods) =>{
        const newFood = getFood()
        return [...prevFoods, newFood]
      })
    }, FOOD_ADD_TIME_INTERVAL)

    return () => clearInterval(addFoodInterval)

  }, [])

  // setting an interval to remove food.
  // Removing foods after FOOD_REMOVE_TIME_INTERVAL time.
  useEffect(() =>{
    const removeFoodInterval = setInterval(()=>{
      setFoods(prevFoods => prevFoods.filter(item => Date.now() - item.time < FOOD_REMOVE_TIME_INTERVAL ))
    }, 1000)
    return () => clearInterval(removeFoodInterval)
  }, [])

  // ?. is called optional chaining
  // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining

  // Returns whether the cell/object {x, y} is occupied by food cell or not.
  const isFood = ({ x, y }) => 
    foods.find((food) => food.x === x && food.y === y)

  // Returns whether the cell/object {x, y} is occupied by food cell or not.
  const isSnake = ({ x, y }) =>
    snake.find((position) => position.x === x && position.y === y);

  // Returns the index of head (an object {x, y}) inside the snake array
  // starting from the startIndex position. 
  const getIndexOf = (startIndex, snake, head) =>{
    for(let i = startIndex; i < snake.length; i++){
      const position = snake[i];
      if(position.x === head.x && position.y === head.y){
        return i;
      }
    }
    return -1;
  }

  // Checking if the snake has collided with itself. 
  // The idea is, we are checking whether the head cell already placed
  // or not in the snake(excluded first valid head cell) 
  const isCollide = (head) =>{
      const idx = getIndexOf(1, snake, head)
      if(idx === -1){
        return false
      }
      return true
  }

  // returns an object{x, y, time} as food cell.
  const getFood = () => {
    // get random cell first
    let newFood = getRandomCell();
    // checking whether the cell is already occupied by snake cell or another food cell.
    // and searching for an empty cell which we can placed food. 
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
