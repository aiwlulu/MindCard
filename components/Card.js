import React, { useState } from "react";

const Card = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navBarHeight = 80;
  const offset = 50;
  const maxHeight = "calc(100vh - 300px)";

  return (
    <div
      className="fixed right-0"
      style={{ top: `${navBarHeight + offset}px` }}
    >
      <button
        className="text-white p-2"
        style={{
          backgroundColor: "rgb(45, 55, 72)",
          borderRadius: "0.5rem",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "Close" : "Card"}
      </button>

      {isOpen && (
        <div
          className="w-80 mt-4 text-white p-4 overflow-auto"
          style={{
            backgroundColor: "rgb(45, 55, 72)",
            maxHeight: maxHeight,
          }}
        >
          <div>Card Content</div>
          <div>
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Distinctio
            similique qui consequatur placeat iste, impedit quod.
            Necessitatibus, alias non at quas mollitia voluptatem accusamus
            ducimus, quo cum atque similique sit?Lorem ipsum dolor sit, amet
            consectetur adipisicing elit. Officia cupiditate fugiat perspiciatis
            fuga modi ex porro ab placeat, molestias molestiae distinctio,
            architecto iusto. Voluptas dolorum recusandae doloremque neque fuga
            saepe aspernatur consectetur ipsam sint repellat ea laboriosam dicta
            possimus, labore amet vitae! Qui, excepturi sint, placeat sit nam
            distinctio at amet tempore nisi reiciendis quisquam blanditiis odio,
            provident maiores tempora? Error beatae eligendi, omnis consectetur
            neque quo laboriosam! Fuga nam, voluptate perferendis minus sunt
            asperiores omnis rerum consequuntur similique, veniam dignissimos
            numquam aut atque, magni exercitationem nobis quasi nulla autem
            doloribus quis natus incidunt modi. Iusto, expedita eligendi?
            Adipisci, eaque.Lorem, ipsum dolor sit amet consectetur adipisicing
            elit. Distinctio similique qui consequatur placeat iste, impedit
            quod. Necessitatibus, alias non at quas mollitia voluptatem
            accusamus ducimus, quo cum atque similique sit?Lorem ipsum dolor
            sit, amet consectetur adipisicing elit. Officia cupiditate fugiat
            perspiciatis fuga modi ex porro ab placeat, molestias molestiae
            distinctio, architecto iusto. Voluptas dolorum recusandae doloremque
            neque fuga saepe aspernatur consectetur ipsam sint repellat ea
            laboriosam dicta possimus, labore amet vitae! Qui, excepturi sint,
            placeat sit nam distinctio at amet tempore nisi reiciendis quisquam
            blanditiis odio, provident maiores tempora? Error beatae eligendi,
            omnis consectetur neque quo laboriosam! Fuga nam, voluptate
            perferendis minus sunt asperiores omnis rerum consequuntur
            similique, veniam dignissimos numquam aut atque, magni
            exercitationem nobis quasi nulla autem doloribus quis natus incidunt
            modi. Iusto, expedita eligendi? Adipisci, eaque.
          </div>
        </div>
      )}
    </div>
  );
};

export default Card;
