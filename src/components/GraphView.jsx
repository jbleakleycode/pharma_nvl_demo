import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InteractiveNvlWrapper } from "@neo4j-nvl/react";
import FitToScreenButton from "../utils/FitToScreenButton";
import ChangeNodeViewButton from "../utils/ChangeNodeViewButton";
import {
  setTempNodePositions,
  setInitialNodePositions,
} from "../redux/actions";
import "../output.css";

const GraphView = React.memo(({ nodeData }) => {
  const dispatch = useDispatch();
  const savedNodePositions = useSelector(
    (state) => state.nodePositions.nodePositions
  );
  const initialNodePositions = useSelector(
    (state) => state.initialNodePositions.initialNodePositions
  );

  const compoundsArray = nodeData.compounds;
  const relsArray = nodeData.relationships;
  const nodes = [];
  const relationships = [];
  const nvlRef = useRef();
  const [nodeViewImg, setNodeViewImg] = useState(true);
  const nodePositionsRef = useRef({});

  for (let i = 0; i < compoundsArray.length; i++) {
    const moleculeId = compoundsArray[i].compound_id.toString();
    const caption = compoundsArray[i].caption.toString();
    const html = document.createElement("img");
    html.src = `https://www.chemspider.com/ImagesHandler.ashx?id=${moleculeId}&w=250&h=250`;
    html.style = nodeViewImg ? "opacity: 1" : "opacity: 0";
    html.setAttribute("draggable", "false");

    nodes.push({
      id: moleculeId,
      captions: [{ value: nodeViewImg ? `` : `${caption}`, styles: ["bold"] }],
      color: nodeViewImg ? "#FFFFFF" : "#006699",
      size: 25,
      html,
    });
  }

  for (let i = 0; i < relsArray.length; i++) {
    const caption = relsArray[i].label.toString();
    relationships.push({
      id: i.toString(),
      from: relsArray[i].from.toString(),
      to: relsArray[i].to.toString(),
      color: "#00334d",
      captions: [{ value: `${caption}` }],
      width: relsArray[i].width,
    });
  }

  const mouseEventCallbacks = {
    onNodeClick: () => void 0,
    onZoom: () => void 0,
    onDrag: (nodes) => {
      const newPositions = nvlRef.current?.getNodePositions();
      nodePositionsRef.current = newPositions;
    },
    onPan: () => void 0,
  };

  const handleChangeNodeView = () => {
    setNodeViewImg((prevNodeViewImg) => !prevNodeViewImg);
  };

  const idArray = [];
  for (let i = 0; i < compoundsArray.length; i++) {
    idArray.push(nodes[i].id);
  }

  const checkCoactives = (relsArray) => {
    const sortedRelsArray = [...relsArray].sort(
      (a, b) => a.noCoActives - b.noCoActives
    );

    const numberOfWidths = Math.min(sortedRelsArray.length, 5);

    const maxCoactives =
      sortedRelsArray[sortedRelsArray.length - 1].noCoActives;

    const coactiveDivide = Math.ceil(maxCoactives / numberOfWidths);

    for (let i = 1; i <= numberOfWidths; i++) {
      for (let j = 0; j < sortedRelsArray.length; j++) {
        const noCoActives = sortedRelsArray[j].noCoActives;
        if (
          noCoActives > coactiveDivide * (i - 1) &&
          noCoActives <= coactiveDivide * i
        ) {
          sortedRelsArray[j].width = i;
        }
      }
    }
    return sortedRelsArray;
  };

  checkCoactives(relsArray);

  const fitToScreen = () => {
    nvlRef.current?.fit(idArray);
    console.log("node positions", nvlRef.current?.getNodePositions());
    console.log("initial node positions", initialNodePositions);
    nvlRef.current?.setNodePositions(initialNodePositions);
  };

  useEffect(() => {
    setTimeout(() => {
      nvlRef.current?.fit(idArray);
    }, 100);

    if (
      initialNodePositions === undefined ||
      Object.keys(initialNodePositions).length === 0
    ) {
      setTimeout(() => {
        console.log("Component did mount");
        const initialPosition = nvlRef.current?.getNodePositions();
        dispatch(setInitialNodePositions(initialPosition));
      }, 1000);
    }
  }, []);

  // useEffect(() => {
  //   if (Object.keys(nodePositionsRef.current).length > 0) {
  //     dispatch(setTempNodePositions(nodePositionsRef.current));
  //   }
  // }, [nodePositionsRef.current]);

  return (
    <div>
      <div style={{ height: "95vh" }}>
        <InteractiveNvlWrapper
          nodes={nodes}
          rels={relationships}
          captions={["caption"]}
          ref={nvlRef}
          layout="hierarchical"
          nvlOptions={{ initialZoom: 2, useWebGL: false }}
          nvlCallbacks={{ onLayoutDone: () => console.log("layout done") }}
          mouseEventCallbacks={mouseEventCallbacks}
        />
      </div>
      <FitToScreenButton onClick={fitToScreen} />
      <ChangeNodeViewButton onClick={handleChangeNodeView} />
    </div>
  );
});

export default GraphView;
