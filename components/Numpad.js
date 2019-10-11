import PropTypes from "prop-types"

const Numpad = props => {
  return (
    <div className="numpad-container">
      <ul id="keyboard">
        <li className="letter numpad">
          <button
            type="button"
            className="ripple"
            onClick={() => props.handleNumpad(1)}
          >
            1
          </button>
        </li>
        <li className="letter numpad">
          <button
            type="button"
            className="ripple"
            onClick={() => props.handleNumpad(2)}
          >
            2
          </button>
        </li>
        <li className="letter numpad">
          <button
            type="button"
            className="ripple"
            onClick={() => props.handleNumpad(3)}
          >
            3
          </button>
        </li>
        <li className="letter numpad clearl">
          <button
            type="button"
            className="ripple"
            onClick={() => props.handleNumpad(4)}
          >
            4
          </button>
        </li>
        <li className="letter numpad">
          <button
            type="button"
            className="ripple"
            onClick={() => props.handleNumpad(5)}
          >
            5
          </button>
        </li>
        <li className="letter numpad">
          <button
            type="button"
            className="ripple"
            onClick={() => props.handleNumpad(6)}
          >
            6
          </button>
        </li>
        <li className="letter numpad clearl">
          <button
            type="button"
            className="ripple"
            onClick={() => props.handleNumpad(7)}
          >
            7
          </button>
        </li>
        <li className="letter numpad">
          <button
            type="button"
            className="ripple"
            onClick={() => props.handleNumpad(8)}
          >
            8
          </button>
        </li>
        <li className="letter numpad">
          <button
            type="button"
            className="ripple"
            onClick={() => props.handleNumpad(9)}
          >
            9
          </button>
        </li>
        <li className="letter numpad clearl">
          <button type="button" className="ripple" onClick={props.clearSearch}>
            X
          </button>
        </li>
        <li className="letter numpad">
          <button
            type="button"
            className="ripple"
            onClick={() => props.handleNumpad(0)}
          >
            0
          </button>
        </li>
        <li className="letter numpad">
          <button type="button" className="ripple" onClick={props.deleteSearch}>
            {"Del"}
          </button>
        </li>
      </ul>
    </div>
  )
}

Numpad.propTypes = {
  deleteSearch: PropTypes.func,
  handleNumpad: PropTypes.func,
  clearSearch: PropTypes.func
}

export default Numpad
