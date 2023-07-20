
import { Component } from "react";
import PropTypes from "prop-types";


class ClassExcel extends Component {
    constructor(props) {
        super();
        const data = props.initialData.map((row, idx) => row.concat(idx));
        this.state = {
            data,
            sortby: null,
            descending: false,
            edit: null,
            search: false,
        };

        // log the initial state
        this.log = [this.state];
        this.replayId = null;
        this.preSearchData = null;

        /*In ReactJs, when we are working with class-based components and want to access this inside a class method. 
        This will need to bind it. Binding this allows it to access the state and setstate inside the class.  */
        this.sort = this.sort.bind(this);
        this.showEditor = this.showEditor.bind(this);
        this.save = this.save.bind(this);
        this.toggleSearch = this.toggleSearch.bind(this);
        this.search = this.search.bind(this);
        this.replay = this.replay.bind(this);
        this.logSetState = this.logSetState.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.downloadJSON = this.download.bind(this, 'json');
        this.downloadCSV = this.download.bind(this, 'csv');
    }

    

    sort(e) {
        const column = e.target.cellIndex; // the index of cell in the row
        const data = this.state.data;

        const descending = this.state.sortby === column && !this.state.descending;
        
        data.sort((a, b) => {
            if(a[column] === b[column]) {
                return 0;
            }

            return descending 
                    ? a[column] < b[column] ? 1 : -1
                    : a[column] > b[column] ? 1 : -1;
        })

        this.logSetState({
            data,
            sortby: column,
            descending,
        })
    }

    showEditor(e) {
        // you cannot get row index just like column index
        // you have to manually add the row index in the dataset
        this.logSetState({
            edit: {
                row: parseInt(e.target.parentNode.dataset.row, 10),
                column: e.target.cellIndex
            }
        })
    }

    /*
     If the user is editing (even while searching), now the two pieces of data need an update. 
     That’s the whole reason for adding a record ID—so you can find the real row even in a filtered state.
    */
    save(e) {
        e.preventDefault();
        const input = e.target.firstChild;
        const data = this.state.data.map((row) => {
            if(row[row.length - 1] === this.state.edit.row) {
                row[this.state.edit.column] = input.value;
            }
            return row;
        });

        this.logSetState({
            edit: null,
            data,
        })

        if(this.preSearchData) {
            this.preSearchData[this.state.edit.row][this.state.edit.column] = input.value;
        }

        // This was the previous code to save only without search feature
        // const data = this.state.data.map;
        // data[this.state.edit.row][this.state.edit.column] = input.value;

        // this.setState({
        //     edit: null,
        //     data,
        // })
    }

    toggleSearch () {
        if(this.state.search) {
            this.logSetState({
                data: this.preSearchData,
                search: false,
            });
            this.preSearchData = null;
        } else {
            this.preSearchData = this.state.data;
            this.logSetState({
                search: true,
            })
        }
    }

    search (e) {
        const needle = e.target.value.toLowerCase();

        if(!needle) {
            this.logSetState({data: this.preSearchData});
            return;
        }

        const idx = e.target.dataset.idx;
        const searchData = this.preSearchData.filter((row) => {
            return row[idx].toString().toLowerCase().indexOf(needle) > -1;
        });

        this.logSetState({data: searchData});
    }

    // This will two things:
    // log the new state
    // then pass it over to setState()
    logSetState(newState) {
        // remember the old state in a clone
        this.log.push(newState);

        // now set it
        this.setState(newState);
    }

    componentDidMount() {
        document.addEventListener('keydown', this.keydownHandler);

        fetch('https://www.phpied.com/files/reactbook/table-data.json')
            .then((response) => response.json())
            .then((initialData) => {
                const data = initialData.map((row, idx) => {
                    row.push(idx);
                    return row;
                });
                this.setState({data});
            })
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.keydownHandler);
        clearInterval(this.replayId);
    }
    
    replay() {
        if(this.log.length === 1) {
            console.warn('No state changes to replay yet');
        }

        let idx = -1;
        this.replayId = setInterval(() => {
            if(++idx === this.log.length - 1) {
                // the end
                clearInterval(this.replayId);
            }
            this.setState(this.log[idx]);
        }, 1000);
    }

    keydownHandler(e) {
        if(e.altKey && e.shiftKey && e.keyCode === 82){
            // ALT + SHIFT + R (replay)
            // this.replay();
            console.log(this.replay());
        }
    }

    download(format, ev) {
        const data = this.state.data.map(row => {
            row.pop(); // drop the last column, the recordId
            return row;
        });

        const contents = format === 'json' 
            ? JSON.stringify(data, null, ' ')
            : data.reduce((result, row) => {
                return (
                    result + 
                    row.reduce((rowcontent, cellcontent, idx) => {
                        const cell = cellcontent.replace(/" /g, '""');
                        const delimiter = idx < row.length - 1 ?',' : '';
                        return `${rowcontent}"${cellcontent}"${delimiter}`
                    }, '') + '\n'
                );
            }, '');

        const URL = window.URL || window.webkitURL;
        const blob = new Blob([contents], {type: 'text/' + format});
        ev.target.href = URL.createObjectURL(blob);
        ev.target.download = 'data.' + format;
    }


    render() {
        const searchRow = !this.state.search ? null : (
            <tr onChange={this.search}>
                {this.props.headers.map((_, idx) => {
                    return <td key={idx}>
                        <input className="td" type="text" data-idx={idx} />
                    </td>
                })}
            </tr>
        )

        return (
            <div className="table-wrapper">
                <div className="table-content">
                    <button className="toolbar" onClick={this.toggleSearch}>
                        {this.state.search ? 'Hide search' : 'Show search'}
                    </button>
                    <a href="data.json" className="toolbar" onClick={this.downloadJSON}>Export JSON</a>
                    <a href="data.csv" className="toolbar" onClick={this.downloadCSV}>Export CSV</a>
                    <table>
                        <thead onClick={this.sort}>
                            <tr>
                                {
                                    this.props.headers.map((title, idx) => {
                                        if(this.state.sortby === idx) {
                                            title += this.state.descending ? ' \u2191' : ' \u2193'
                                        }
                                        return <th key={idx}>{title}</th>
                                    })
                                }
                            </tr>
                        </thead>
                        {this.state.data.length === 0 ? (
                            <tbody>
                                <tr>
                                    <td className="td" colSpan={this.props.headers.length}>
                                        Loading data...
                                    </td>
                                </tr>
                            </tbody>
                        ) : (                         
                            <tbody onDoubleClick={this.showEditor}>
                                {searchRow}
                                {
                                    this.state.data.map((row, rowidx) => {
                                        // the last piece of data in a row is the ID
                                        const recordId = row[row.length - 1];

                                        return (<tr key={recordId} data-row={recordId}>
                                            {
                                                row.map((cell, columnIdx) => {

                                                    if(columnIdx === this.props.headers.length) {
                                                        // do not show the record ID in the table UI
                                                        return;
                                                    }

                                                    const edit = this.state.edit;
                                                    if(edit && edit.row === rowidx && edit.column === columnIdx) {
                                                        cell = (
                                                            <form onSubmit={this.save}>
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
                        )
                        }

                    </table>
                </div>
            </div>
        )
    }
}

ClassExcel.propTypes = {
    headers: PropTypes.arrayOf(PropTypes.string),
    initialData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.any))
}
export default ClassExcel;