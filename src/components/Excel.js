import { useEffect, useState } from "react";
import PropTypes from "prop-types";

let dataLog = [];
let auxLog = [];
let isReplaying = false;

function useLoggedState(initialValue, isData) {
    const [state, setState] = useState(initialValue);

    useEffect(() => {
        if(isReplaying) {
            return;
        }

        if(isData) {
            dataLog.push([state, setState]);
        } else {
            const idx = dataLog.length - 1;
            if(!auxLog[idx]) {
                auxLog[idx] = [];
            }

            auxLog[idx].push([state, setState]);
        }

    }, [state]);

    return [state, setState];

}
function Excel ({headers, initialData}) {
    const [data, setData] = useLoggedState(initialData);
    const [sorting, setSorting] = useLoggedState({
        column: null,
        descending: false,
    });
    const [edit, setEdit] = useLoggedState(null);
    const [search, setSearch] = useLoggedState(false);
    const [preSearchData, setPreSearchData] = useLoggedState(null);
    let replayId;


    function sort(e) {
        const column = e.target.cellIndex; // the index of cell in the row
        const dataCopy = data;

        const descending = sorting.column === column && !sorting.descending;
        
        dataCopy.sort((a, b) => {
            if(a[column] === b[column]) {
                return 0;
            }

            return descending 
                    ? a[column] < b[column] ? 1 : -1
                    : a[column] > b[column] ? 1 : -1;
        })

        setData(dataCopy);
        setSorting({column, descending});
    }

    function showEditor (e) {
        setEdit({
            row: parseInt(e.target.parentNode.dataset.row, 10),
            column: e.target.cellIndex,
        });
    }

    function save(e) {
        e.preventDefault();
        const input = e.target.firstChild;
        const dataCopy = data;
        dataCopy[edit.row][edit.column] = input.value;
        setEdit(null);
        setData(dataCopy);
    }

    useEffect(() => {
        function keydownHandler (e) {
            if(e.altKey && e.shiftKey && e.keyCode === 82){
                // ALT + SHIFT + R (replay)
                // this.replay();
                // console.log(this.replay());
                replay();
            }
        }

        document.addEventListener('keydown', keydownHandler);

        return () => {
            document.removeEventListener('keydown', keydownHandler);
            clearInterval(replayId);
            dataLog = [];
            auxLog = [];
        }
    }, [])

    function replay() {
        isReplaying = true;
        let idx = 0;
        replayId = setInterval(() => {
            const [data, fn] = dataLog[idx];
            fn(data);
            auxLog[idx] &&
                auxLog[idx].forEach((log) => {
                    const [data, fn] = log;
                    fn(data);
                });
                idx++;
                if(idx > dataLog.length - 1) {
                    isReplaying = false;
                    clearInterval(replayId);
                    return;
                }
        }, 1000)
    }

    return (
            <div className="table-wrapper">
                <div className="table-content">
                    <table>
                        <thead onClick={sort}>
                            <tr>
                                {
                                    headers.map((title, idx) => {
                                        if(sorting.column === idx) {
                                            title += sorting.descending ? ' \u2191' : ' \u2193'
                                        }
                                        return <th key={idx}>{title}</th>
                                    })
                                }
                            </tr>
                        </thead>                   
                        <tbody onDoubleClick={showEditor}>
                            {
                                data.map((row, rowIdx) => {
                                    return (<tr key={rowIdx} data-row={rowIdx}>
                                        {
                                            row.map((cell, columnIdx) => {
                                                if(edit && edit.row === rowIdx && edit.column === columnIdx) {
                                                    cell = (
                                                        <form onSubmit={save}>
                                                            <input className="td" type="text" defaultValue={cell} />
                                                        </form>
                                                    )
                                                }
                                                return <td className="td" key={columnIdx}>{cell}</td>
                                            })
                                        }
                                    </tr>
                                )}
                                )
                            }
                        </tbody>
                    </table>
                </div>
            </div>
    )
}

Excel.propTypes = {
    headers: PropTypes.arrayOf(PropTypes.string),
    initialData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.any))
}

export default Excel;