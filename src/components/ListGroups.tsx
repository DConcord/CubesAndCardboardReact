// import { MouseEvent } from "react";

import { useState } from "react";

interface Props {
  items: string[];
  heading: string;
  onSelectItem: (item: string) => void;
}

// function ListGroup(props: Props) {
function ListGroup({ items, heading, onSelectItem }: Props) {
  //   let items = ["New York", "London", "Tokyo", "Paris", "Houston"];
  const [selectedIndex, setSelectedIndex] = useState(-1);
  //   items = [];

  //   const message = items.length === 0 ? <p>No Items Found</p> : null;

  //   const getMessage = () => {
  //     return items.length === 0 ? <p>No Items Found</p> : null;
  //   };

  //   if (items.length === 0)
  //     return (
  //       <>
  //         <h1>List</h1>
  //         <p>No Item Found</p>
  //       </>
  //     );

  // Event Handler
  //   const handleClick = (event: MouseEvent) => console.log(event);

  return (
    <>
      <h1>{heading}</h1>
      {/* {message} */}
      {/* {getMessage()} */}
      {/* {items.length === 0 ? <p>No Item Found</p> : null} */}
      {items.length === 0 && <p>No Items Found</p>}
      <ul className="list-group">
        {items.map((item, index) => (
          <li
            key={item}
            onClick={() => {
              setSelectedIndex(index);
              onSelectItem(item);
            }}
            // onClick={() => console.log(`${item} ${index} Clicked`)}
            className={
              selectedIndex === index
                ? "list-group-item active"
                : "list-group-item"
            }
          >
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}

export default ListGroup;
