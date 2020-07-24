import React, { Component } from "react";
import { Context } from "../context/Context";
import Joi from "joi-browser";
import Input from "../shared/Input";
import Dropdown from '../shared/Dropdown';


class AddNote extends Component {
  static contextType = Context;

  state = {
    note: { title: "", body: "" },
    categories: [],
    errors: {},
  };

  schema = Joi.object({
    title: Joi.string().min(2).required().label("Title"),
    body: Joi.string().min(2).required().label("Description"),
    categories: Joi.array().min(1).required().label("Category"),
    picture: Joi.any(),
  });

  onInputChange = (event) => {
    let note;
    if (event.target?.files) {
      note = {
        ...this.state.note,
        [event.target.id]: event.target.files[0],
      };
    } else {
      note = {
        ...this.state.note,
        [event.target.id]: event.target.value,
      };
    }

    const errors = this.validateNote({
      ...note,
      categories: this.state.categories,
    });
    this.setState({ note, errors });
  };

  validateNote = (note) => {
    const options = { abortEarly: true };
    const { error } = Joi.validate(note, this.schema, options);
    if (!error) return null;

    const errors = {};
    for (let item of error.details) errors[item.path[0]] = item.message;
    return errors;
  };

  onFormSubmit = async (event) => {
    event.preventDefault();
    const { note } = this.state;
    const { categories } = this.state;
    const category_response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/categories`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ categories }),
      }
    );

    const category_json = await category_response.json();

    // stringify to send "[]" to backend

    note.category_ids = JSON.stringify(category_json.map((c) => c.id));

    const data = new FormData();
    for (let key in note) {
      data.append(`note[${key}]`, note[key]);
    }

    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/notes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: data,
    });

    const noteData = await response.json();
    const noteToAdd = { ...noteData.note, picture: noteData.picture };

    this.context.dispatchUser("add", noteToAdd);
    this.props.history.push("/notes");
  };

  categoriesUpdated = (updatedCategories) => {
      this.setState({categories: updatedCategories});
  }

 
  render() {
    const { errors } = this.state;
    const { title, body } = this.state.note;
    

    return (
      <div className="container">
        <h1>Add a new Note</h1>
        <form encType="multipart/form-data" onSubmit={this.onFormSubmit}>

          <Input
            name="title"
            label="Title"
            onChange={this.onInputChange}
            value={title}
            error={errors && errors.title}
          />

          <Dropdown allCategories={this.context.categories}
          selected={this.state.categories}
          onCategoriesChanged={this.categoriesUpdated}
          errors={errors && errors.categories}
          categoryError={this.categoryError}
          />
         

          <Input
            name="body"
            label="Description"
            onChange={this.onInputChange}
            value={body}
            error={errors && errors.body}
          />

          <Input
            type="file"
            name="picture"
            id="picture"
            label="Image"
            onChange={this.onInputChange}
          />

          <button
            disabled={this.state.errors}
            type="submit"
            className="btn btn-primary mt-3 ml-1"
          >
            Submit
          </button>
        </form>
      </div>
    );
  }
}

export default AddNote;
