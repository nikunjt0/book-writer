export const imageThemes = {
    renaissance: {
      color: "red",
      images: [
        "/alexander_gordian_knot.jpg",
        "/caesar_emperor.webp",
        "/death_of_julius_caesar.jpg",
        "/scipio_africanus_freeing_massiva.jpg",
      ],
    },
    nautical: {
      color: "blue",
      images: [
        "/breezingup.jpg",
        "/jacquescousteau.jpg",
        "/nassau.jpg",
        "/stevezissou.jpg",
      ],
    },
    fantasy: {
      color: "green",
      images: [
        "/smeagol.jpg",
        "/frodo.jpg",
        "/hogwarts.jpg",
        "/gotgreen.jpg",
      ],
    },
  }
  
  export const getTodaysTheme = () => {
    const date = new Date()
    const day = date.getDate()

    console.log(day % 3);
  
    if (day % 3 === 0) return "nautical"
    if (day % 3 === 1) return "renaissance"
    return "fantasy"
  }
  