import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Context } from "../context/Context";
import Pagination from "../shared/Pagination";
import { paginate } from "../shared/paginate";
import moment from "moment";
import ConfirmPopover from "../shared/ConfirmPopover";

class Notes extends Component {
  static contextType = Context;

  state = {
    pageSize: 3,
    currentPage: 1,
  };

  deleteNote = async (id) => {
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/notes/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    this.context.dispatchUser("delete", id);
  };

  renderNotes = (notes) => {
    const uncompletedNotes = notes.filter((n) => n.completed === false);
    let sorted = uncompletedNotes.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    const { pageSize, currentPage } = this.state;
    const notesList = paginate(sorted, currentPage, pageSize);
    return notesList.map((note, index) => {
      return (
        <div key={index} className="card border-secondary">
          <div className="card-header" id="note_title">
            {note.title}
          </div>
          <p className="card-text ml-2 mt-2" id="note_body">
            {note.body}
          </p>
          <img src={note.picture} alt="" id="note_image" />
          <div className="note_card">
            <p className="card-text">
              <small className="text-muted">
                Updated {moment(note.updated_at).startOf("minute").fromNow()}
              </small>
            </p>
            <div className="note_buttons">
              {this.renderShareButton(note)}

              <img
                src={require("../assets/back.png")}
                width="25"
                height="25"
                alt="icon"
                id="back_icon"
                onClick={this.props.history.goBack}
              />

              <Link
                to={{
                  pathname: `/notes/${note.id}`,
                  state: note,
                }}
              >
                <img
                  src={require("../assets/view.png")}
                  width="25"
                  height="25"
                  alt="icon"
                  id="view_note_icon"
                />
              </Link>

              <img
                src={require("../assets/delete.png")}
                width="30"
                height="30"
                alt="icon"
                id="delete_icon"
                onClick={() =>
                  window.confirm("Are you sure?")
                    ? this.deleteNote(note.id)
                    : this.props.history.goBack
                }
              />
            </div>
          </div>
        </div>
      );
    });
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  getCohortStudents = async () => {
    const { currentUser, users } = this.context;
    let user = users.find((i) => i.email === currentUser.user);
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/cohorts/${user.id}/cohorts_students`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const { all_students } = await response.json();

    this.context.dispatchUser("populateCohortStudents", all_students);
  };

  handleShare = async (note) => {
    const id = note.id;
    const { cohortStudents } = this.context;
    let student_ids = cohortStudents.map((i) => i.id);
    const body = {
      note_id: id,
      student_ids: student_ids,
    };

    await fetch(`${process.env.REACT_APP_BACKEND_URL}/notes/shared_note`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  renderShareButton = (note) => {
    const { cohortStudents } = this.context;
    if (cohortStudents) {
      return (
        <ConfirmPopover
          onCompleted={() => {
            this.handleShare(note);
            this.forceUpdate();
            alert("The note is shared with your students");
          }}
          buttonText="share"
          confirmText="Share with your students"
          id="share_popover"
        />
      );
    }
  };

  async componentDidMount() {
    await this.getCohortStudents();
  }

  render() {
    const { notes, search } = this.context;
    const { pageSize, currentPage } = this.state;
    const uncompletedNotes = notes.filter((n) => n.completed === false);

    if (notes) {
      let filteredNotes = [
        ...new Set(
          notes
            .filter((note) => {
              return note.title.indexOf(search) !== -1;
            })
            .concat(
              notes.filter((note) => {
                return note.body.indexOf(search) !== -1;
              })
            )
        ),
      ];

      return (
        <React.Fragment>
          <div className="notes_container">
            {this.renderNotes(filteredNotes)}
            <Link to="/notes/completed" className=" c_notes_link">
              see completed notes
            </Link>
          </div>

          <Pagination
            itemsCount={uncompletedNotes.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={this.handlePageChange}
          />
        </React.Fragment>
      );
    } else {
      return null;
    }
  }
}

export default Notes;
