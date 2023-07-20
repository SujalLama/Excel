import { Component } from "react";
import PropTypes from "prop-types";


class Excel extends Component {
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
    
        this.preSearchData = null;

        /*In ReactJs, when we are working with class-based components and want to access this inside a class method. 
        This will need to bind it. Binding this allows it to access the state and setstate inside the class.  */
        this.sort = this.sort.bind(this);
        this.showEditor = this.showEditor.bind(this);
        this.save = this.save.bind(this);
        this.toggleSearch = this.toggleSearch.bind(this);
        this.search = this.search.bind(this);
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

        this.setState({
            data,
            sortby: column,
            descending,
        })
    }

    showEditor(e) {
        // you cannot get row index just like column index
        // you have to manually add the row index in the dataset
        this.setState({
            edit: {
                row: parseInt(e.target.parentNode.dataset.row, 10),
                column: e.target.cellIndex
            }
        })
    }

    save(e) {
        e.preventDefault();
        const input = e.target.firstChild;
        const data = this.state.data;

        data[this.state.edit.row][this.state.edit.column] = input.value;

        this.setState({
            edit: null,
            data,
        })
    }

    toggleSearch () {
        this.setState({
            search: !this.state.search
        })
    }

    search () {

    }

    render() {
        return (
            <div className="table-wrapper">
                <div className="table-content">
                    <button className="toolbar" onClick={this.toggleSearch}>
                        {this.state.search ? 'Hide search' : 'Show search'}
                    </button>
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
                        <tbody onDoubleClick={this.showEditor}>
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

                    </table>
                </div>
            </div>
        )
    }
}

Excel.propTypes = {
    headers: PropTypes.arrayOf(PropTypes.string),
    initialData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.any))
}
export default Excel;