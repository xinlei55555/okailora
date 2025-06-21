package ca.kailo.berkeley

data class Deployment(val id: String, val type: Type, val description: String) {
    enum class Type(val path: String) {
        SEGMENTATION("segmentation"), GENERATION("generation"), CLASSIFICATION("classification"), BBOX("bbox");

        companion object {
            fun of(path: String): Type? {
                return entries.firstOrNull { it.path == path }
            }
        }
    }
}